import { SelectQueryBuilder } from 'typeorm';

export class PaginationResponse {
    content: any;
    total: number;
    page: number;
    size: number;
}

export class PaginationParam<T> {
    query: SelectQueryBuilder<T>;
    alias: string;
    columnDirection: string;
    size?: number;
    page?: number;
    sort?: string;
    defaultSort?: string = 'descend-createdOnDate';
}

export async function toPaginationResponse<T>(params: PaginationParam<T>) {
    if (params.sort) {
        // const sortKeyValue = params.sort.split('-');
        const direction = params.sort;
        // const key = sortKeyValue[1];
        switch (direction) {
            case 'ascend':
                params.query.orderBy(
                    `${params.alias}.${params.columnDirection}`,
                    'ASC',
                );
                break;
            case 'descend':
                params.query.orderBy(
                    `${params.alias}.${params.columnDirection}`,
                    'DESC',
                );
                break;
            default:
                break;
        }
    } else {
        params.query.orderBy(
            `${params.alias}.${params.columnDirection}`,
            'DESC',
        );
    }
    //  else {
    // params.query.orderBy(`${params.alias}.${params.columnDirection}`, 'DESC');
    // }

    const total = await params.query.getCount();
    const take = params.size;
    const skip = (params.page - 1) * take;

    if (!isNaN(take) && !isNaN(skip)) {
        params.query.take(take).skip(skip);
    }

    const content = await params.query.getMany();
    const result: PaginationResponse = {
        content,
        total,
        page: Number(params.page),
        size: Number(params.size),
    };
    return result;
}
