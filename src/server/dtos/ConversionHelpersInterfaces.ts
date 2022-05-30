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
}

export class Filter {
  column: string;
  value: any;
  operation: '<' | '>' | '=' | '<=' | '>=' | '<>' | 'in' | 'between' | 'null';
  negate: boolean;
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
  lenght?: number;

  @IsBoolean()
  @IsOptional()
  isNotNulleable?: boolean;

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
