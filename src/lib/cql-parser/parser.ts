import {KeyspaceDefinition, parseCreateKeyspace} from "@scylla-studio/lib/cql-parser/keyspace-parser";
import {parseTable, TableDefinition} from "@scylla-studio/lib/cql-parser/table-parser";
import {ScyllaSession} from "@lambda-group/scylladb";

export interface DescriptionRow {
    type: string;
    create_statement: string;
    keyspace_name: string;
    name: string;
}

export async function parseKeyspaces(session: ScyllaSession): Promise<Record<string, KeyspaceDefinition>> {

    let parsedKeyspaces = new Map<string, KeyspaceDefinition>();
    let rows = await session.execute("DESC keyspaces");

    for (let row of rows) {
        let result: DescriptionRow[] = await session.execute(`DESC ${row.keyspace_name}`);

        let parsedKeyspace = {} as KeyspaceDefinition;

        for (let row of result) {
            switch (row.type) {
                case "keyspace":
                    parsedKeyspace = parseCreateKeyspace(row);
                    break;
                case "table":
                    parsedKeyspace.tables.set(row.name, parseTable(row));
                    break;
                case "materialized_view":
                    // TODO: Implement materialized view parser

                case "UDTs":
                    // TODO: Implement UDT parser
                default:
                    break;
            }
        }

        parsedKeyspaces.set(row.keyspace_name, parsedKeyspace);
    }

    return Object.fromEntries(parsedKeyspaces);
}