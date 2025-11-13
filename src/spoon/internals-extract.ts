import { NonFunctionPropNames } from '@colyseus/schema/lib/types/HelperTypes';
import { Schema } from '@colyseus/schema';

export function getFieldsList<T extends Schema>(state: T): NonFunctionPropNames<T>[] {
    // v3 API: Symbol.metadata on constructor
    // @ts-ignore: access Symbol.metadata
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const metadata = state.constructor[Symbol.metadata];
    if (metadata) {
        const fields: (keyof T)[] = [];
        for (const index in metadata) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const field = metadata[index];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (field && field.name && !field.deprecated) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                fields.push(field.name as keyof T);
            }
        }
        return fields as NonFunctionPropNames<T>[];
    }

    // If metadata is not available, return empty array (should not happen in normal usage)
    return [];
}
