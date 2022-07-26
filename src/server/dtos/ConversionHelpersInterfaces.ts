import 'reflect-metadata';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class QueryBody {
  filters: Filter[];
  fields?: string[];
  pagination?: {
    pagination: boolean;
    itemsPerPage: number;
    pageIndex: number;
  };
  sort?: {
    byColumn: string;
    direction: 'asc' | 'desc';
  };
}

export class Filter {
  column: string;
  value: any;
  operation:
    | '<'
    | '>'
    | '='
    | '<='
    | '>='
    | '<>'
    | 'in'
    | 'between'
    | 'like'
    | 'null';
  negate: boolean | 'false' | 'true';
  operator: 'and' | 'or';
}

class Reference {
  @IsString()
  table: string;

  @IsString()
  column: string;
}

export class TableCreationColumn {
  @IsString()
  type: string;

  @IsInt()
  @IsOptional()
  length?: number;

  @IsBoolean()
  @IsOptional()
  isNotNullable?: boolean;

  @IsBoolean()
  @IsOptional()
  isUnique?: boolean;

  @IsBoolean()
  @IsOptional()
  isUnsigned?: boolean;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsString()
  @IsInt()
  @IsOptional()
  defaultValue?: number | string;

  @ValidateNested()
  @IsOptional()
  reference?: Reference;
}

export class TableCreationBody {
  @IsObject()
  columns: Record<string, TableCreationColumn>;

  @IsString()
  tableName: string;

  @IsString()
  @IsOptional()
  primaryKeyName?: string;
}
