import SwaggerGenerator from '../../src/server/conversion/SwaggerGenerator';

describe('Swagger created correctly', () => {
  const info = {
    contact: {
      email: '@mail',
      name: 'name',
      url: 'www',
    },
    title: 'title',
    version: '1',
    description: 'desc',
  };

  const host = '3000';

  const openApiVersion = '3';

  const tables = [
    {
      table_name: 'name',
      table_comment: 'comment',
      table_schema: 'schema',
    },
  ];

  const tableColumns = {
    table: [
      {
        column_name: 'string',
        column_default: 'string',
        is_nullable: 'string',
        data_type: 'string',
        column_type: 'string',
        extra: 'string',
        column_comment: 'string',
        column_key: 'string',
      },
      {
        column_name: 'string',
        column_default: 'string',
        is_nullable: 'NO',
        data_type: 'string',
        column_type: 'string',
        extra: 'string',
        column_comment: 'string',
        column_key: 'string',
      },
    ],
  };

  it('Creates tags', () => {
    const swaggerGenerator = new SwaggerGenerator(
      info,
      tableColumns,
      tables,
      host,
      openApiVersion,
    );
    const tags = swaggerGenerator.createTags(tables);

    expect(tags).toStrictEqual([{ name: 'name', description: 'comment' }]);
  });

  it('Creates paths', () => {
    const swaggerGenerator = new SwaggerGenerator(
      info,
      tableColumns,
      tables,
      host,
      openApiVersion,
    );
    const paths = swaggerGenerator.createPaths(tableColumns);
    expect(paths['/api/table']).toBeTruthy();
    expect(paths['/api/table/{id}']).toBeTruthy();
    expect(paths['/api/table/query']).toBeTruthy();
  });

  it('Creates schemas', () => {
    const swaggerGenerator = new SwaggerGenerator(
      info,
      tableColumns,
      tables,
      host,
      openApiVersion,
    );
    const schemas = swaggerGenerator.createSchemas(tableColumns);
    expect(schemas['table']).toBeTruthy();
    expect(schemas['table'].required.length).toBe(1);
    expect(schemas['table_query']).toBeTruthy();
    expect(schemas['table_query']).toBeTruthy();
  });

  it('Generates correct json', () => {
    const swaggerGenerator = new SwaggerGenerator(
      info,
      tableColumns,
      tables,
      host,
      openApiVersion,
    );
    swaggerGenerator.createTags = jest.fn().mockReturnValue({
      tag: true,
    });

    swaggerGenerator.createPaths = jest.fn().mockReturnValue({
      path: true,
    });

    swaggerGenerator.createSchemas = jest.fn().mockReturnValue({
      schema: true,
    });

    const jsonGenerated = swaggerGenerator.generateJSON();

    expect(jsonGenerated.paths).toStrictEqual({
      path: true,
    });

    expect(jsonGenerated.tags).toStrictEqual({
      tag: true,
    });

    expect(jsonGenerated.components.schemas).toStrictEqual({
      schema: true,
    });
  });

  it('Creates with default open ai version', () => {
    const swaggerGenerator = new SwaggerGenerator(
      info,
      tableColumns,
      tables,
      host,
    );

    const generatedJson = swaggerGenerator.generateJSON();

    expect(generatedJson.openapi).toBe('3.0.2');
  });
});
