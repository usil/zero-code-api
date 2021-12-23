interface Column {
  column_name: string;
  column_default: string;
  is_nullable: string;
  data_type: string;
  column_type: string;
  extra: string;
  column_comment: string;
  column_key: string;
  referenced_table_schema?: string;
  referenced_table_name?: string;
  referenced_column_name?: string;
}

interface Table {
  table_name: string;
  table_comment?: string;
  table_schema: string;
}

interface Info {
  contact: Contact;
  title: string;
  version: string;
  description: string;
}

interface Contact {
  email: string;
  name: string;
  url: string;
}

class SwaggerGenerator {
  tablesColumns: Record<string, Column[]>;
  tables: Table[];
  openApiVersion: string;
  info: Info;
  host: string;

  constructor(
    info: Info,
    tablesColumns: Record<string, Column[]>,
    tables: Table[],
    hostBase: string,
    openApiVersion = '3.0.2',
  ) {
    this.host = hostBase;
    this.tables = tables;
    this.info = info;
    this.tablesColumns = tablesColumns;
    this.openApiVersion = openApiVersion;
  }

  createTags(tables: Table[]) {
    const tags = tables.map((t) => {
      return { name: t.table_name, description: t.table_comment };
    });
    return tags;
  }

  createPaths(tablesColumns: Record<string, Column[]>) {
    const paths: Record<string, any> = {};
    for (const tableName in tablesColumns) {
      if (Object.prototype.hasOwnProperty.call(tablesColumns, tableName)) {
        paths[`/api/${tableName}`] = {
          get: {
            tags: [tableName],
            summary: `Get all ${tableName} rows`,
            responses: {
              '200': {
                description: 'success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          example: 'success',
                        },
                        code: {
                          type: 'number',
                          example: 200000,
                        },
                        result: {
                          type: 'array',
                          items: {
                            $ref: `#/components/schemas/${tableName}`,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          post: {
            tags: [tableName],
            summary: `Create a new ${tableName} row`,
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      inserts: {
                        type: 'array',
                        items: {
                          $ref: `#/components/schemas/${tableName}`,
                        },
                      },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'success will the id of the new row',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          example: 'success',
                        },
                        code: {
                          type: 'number',
                          example: 200001,
                        },
                        result: {
                          type: 'array',
                          items: {
                            type: 'number',
                          },
                          example: [1, 2],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };

        paths[`/api/${tableName}/{id}`] = {
          get: {
            tags: [tableName],
            summary: `Get one ${tableName} row`,
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                allowEmptyValue: false,
                example: 1,
                schema: {
                  type: 'string',
                  description: 'Id of the row',
                },
              },
            ],
            responses: {
              '200': {
                description: 'success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          example: 'success',
                        },
                        code: {
                          type: 'number',
                          example: 200000,
                        },
                        result: {
                          type: 'object',
                          $ref: `#/components/schemas/${tableName}`,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          put: {
            tags: [tableName],
            summary: `Update one ${tableName} row`,
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                allowEmptyValue: false,
                example: 1,
                schema: {
                  type: 'string',
                  description: 'Id of the row',
                },
              },
            ],
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    $ref: `#/components/schemas/${tableName}`,
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          example: 'success',
                        },
                        code: {
                          type: 'number',
                          example: 200001,
                        },
                        result: {
                          type: 'number',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          delete: {
            tags: [tableName],
            summary: `Delete one ${tableName} row`,
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                allowEmptyValue: false,
                example: 1,
                schema: {
                  type: 'string',
                  description: 'Id of the row',
                },
              },
            ],
            responses: {
              '200': {
                description: 'success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          example: 'success',
                        },
                        code: {
                          type: 'number',
                          example: 200001,
                        },
                        result: {
                          type: 'number',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };

        paths[`/api/${tableName}/query`] = {
          post: {
            tags: [tableName],
            summary: `Query the ${tableName} table`,
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${tableName}_query`,
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'success',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        message: {
                          type: 'string',
                          example: 'success',
                        },
                        code: {
                          type: 'number',
                          example: 200000,
                        },
                        result: {
                          type: 'array',
                          items: {
                            $ref: `#/components/schemas/${tableName}`,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            parameters: [
              {
                name: 'pagination',
                in: 'query',
                required: false,
                schema: {
                  type: 'boolean',
                  description:
                    'Enable or disable pagination, default value is true',
                },
              },
              {
                name: 'pageIndex',
                in: 'query',
                required: false,
                schema: {
                  type: 'number',
                  description: 'The page number starting from 0',
                },
              },
              {
                name: 'itemsPerPage',
                in: 'query',
                required: false,
                schema: {
                  type: 'number',
                  description: 'The number of items in a page',
                },
              },
            ],
          },
        };
      }
    }
    return paths;
  }

  createSchemas(tablesColumns: Record<string, Column[]>) {
    const schemas: Record<string, any> = {};
    for (const tableName in tablesColumns) {
      const properties: Record<string, any> = {};
      if (Object.prototype.hasOwnProperty.call(tablesColumns, tableName)) {
        const required: string[] = [];
        const columnsNames: string[] = [];
        for (const column of tablesColumns[tableName]) {
          if (column.is_nullable === 'NO') required.push(column.column_name);
          columnsNames.push(column.column_name);
          properties[column.column_name] = {
            type: column.column_type,
            description: column.column_comment,
          };
        }
        schemas[tableName] = {
          type: 'object',
          required,
          properties,
        };

        schemas[`${tableName}_query`] = {
          type: 'object',
          required: ['filters'],
          properties: {
            filters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  column: {
                    type: 'string',
                    enum: [...columnsNames],
                  },
                  value: {},
                  operation: {
                    type: 'string',
                    enum: [
                      '<',
                      '>',
                      '=',
                      '<=',
                      '>=',
                      '<>',
                      'in',
                      'between',
                      'null',
                    ],
                  },
                  negate: {
                    type: 'boolean',
                  },
                  operator: {
                    type: 'string',
                    enum: ['and', 'or'],
                  },
                },
              },
            },
            fields: {
              type: 'array',
              items: {
                type: 'string',
              },
              enum: [...columnsNames],
            },
          },
        };
      }
    }
    return schemas;
  }

  generateJSON() {
    const tags = this.createTags(this.tables);
    const paths = this.createPaths(this.tablesColumns);
    const schemas = this.createSchemas(this.tablesColumns);
    const baseSwaggerJson = {
      openapi: this.openApiVersion,
      info: this.info,
      servers: [{ url: this.host }],
      tags,
      paths,
      components: {
        schemas,
      },
    };
    return baseSwaggerJson;
  }
}

export default SwaggerGenerator;