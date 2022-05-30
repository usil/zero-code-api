import { TableCreationColumn } from '../dtos/ConversionHelpersInterfaces';

class CreateTableFromJson {
  tableName: string;
  primaryKeyName: string;
  createPrimaryKeyStatement: string;
  baseStatement = 'CREATE TABLE IF NOT EXISTS';

  constructor(tableName: string, primaryKeyName: string | undefined) {
    this.tableName = tableName;
    this.primaryKeyName = primaryKeyName || 'id';
    this.baseStatement += ` ${tableName}(\n${this.primaryKeyName} INT UNSIGNED NOT NULL AUTO_INCREMENT`;
  }

  parseDefaultValue(defaultValue: number | string) {
    if (defaultValue === undefined) return '';
    if (isNaN(defaultValue as any)) return ` DEFAULT '${defaultValue}'`;
    return ` DEFAULT ${defaultValue}`;
  }

  generateCreationStringFromJSON(columns: Record<string, TableCreationColumn>) {
    let completeStatement = this.baseStatement;
    let endOfStatement = '';
    for (const columnName in columns) {
      const columnInfo = columns[columnName];
      completeStatement += `,\n${columnName} ${columnInfo.type}${
        columnInfo.lenght ? '(' + columnInfo.lenght + ')' : ''
      }${columnInfo.isUnsigned ? ' UNSIGNED' : ''}${
        columnInfo.isNotNulleable ? ' NOT NULL' : ' NULL'
      }${this.parseDefaultValue(columnInfo.defaultValue)}${
        columnInfo.comment ? ` COMMENT '` + columnInfo.comment + `'` : ''
      }`;

      if (columnInfo.isUnique)
        endOfStatement += `,\nCONSTRAINT UC_${this.tableName}_${columnName} UNIQUE (${columnName})`;

      if (columnInfo.reference) {
        endOfStatement += `,\nCONSTRAINT FK_${columnInfo.reference.table}_${this.tableName} FOREIGN KEY (${columnName})\nREFERENCES ${columnInfo.reference.table}(${columnInfo.reference.column})`;
      }
    }

    completeStatement +=
      `,\nCONSTRAINT PK_${this.tableName} PRIMARY KEY (${this.primaryKeyName})` +
      endOfStatement +
      '\n);';

    return completeStatement;
  }
}

export default CreateTableFromJson;
