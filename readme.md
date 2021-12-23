# zero-code-api 0.0.1-pre-alpha

Zero Code Api is low code platform to expose mysql database as a Restful Api wih endpoints ready to use. This is an alternative to these tools `strapi, nocodb, xmysql, dreamfactory, deployd`.

## Features

- Ready to use restful CRUD operations
- Swagger portal to play with endpoints

## Requirements

- nodejs >= 14

## Usage

### Environment variables

First put the following env variables.

| Variable             | Description        |
| -------------------- | ------------------ |
| `DATA_BASE_NAME`     | Data base name     |
| `DATA_BASE_HOST`     | Data base host     |
| `DATA_BASE_PORT`     | Data base port     |
| `DATA_BASE_USER`     | Data base port     |
| `DATA_BASE_PASSWORD` | Data base password |
| `PORT`               | Application port   |

## Usage For Development

First run `npm install`. To start development run `npm run dev`.

## Usage For Production

For production you should build your app `npm run build` will create a dist file. Then run `npm start`.

## Accessing the endpoints

You can look for a complete swagger documentation of every auto generated endpoint for your database going to `/api/docs`.

| Method | Endpoint                  | Description                               |
| ------ | ------------------------- | ----------------------------------------- |
| GET    | `/api/<table_name>`       | Get all table rows                        |
| POST   | `/api/<table_name>`       | Create a new route                        |
| GET    | `/api/<table_name>/:id`   | Get one row from the table given an id    |
| PUT    | `/api/<table_name>/:id`   | Update one row from the table given an id |
| DELETE | `/api/<table_name>/:id`   | Delete one row from the table given an id |
| POST   | `/api/<table_name>/query` | Query the table data                      |

**Every table primary key should be named id**

## The query endpoint

Using a `POST` method in `/api/<table_name>/query` you will be able your query the table data.

In the body you should send an object:

| Key     | Endpoint                                             | Type       |
| ------- | ---------------------------------------------------- | ---------- |
| filters | An array of filters                                  | `Filter[]` |
| fields  | An array of the columns that you want to be returned | `string[]` |

### The filter object

| Key       | Endpoint                                                      | Type      |
| --------- | ------------------------------------------------------------- | --------- |
| column    | The name of the column to filter by                           | `string`  |
| value     | The column value                                              | `any`     |
| operation | What operation of comparison do you want the where to preform | `string`  |
| negate    | Negate the operation Example: `notWhere`                      | `boolean` |
| operator  | Use `and` or `or` logical operator                            | `string`  |

### Supported operations

The supported operations are: `'<' | '>' | '=' | '<=' | '>=' | '<>' | 'in' | 'between' | 'null'`.

### Pagination

By default the pagination is enabled. To disable it send in the query `/api/<table_name>/query?pagination=false`. You can also send `itemsPerPage` and `pageIndex`.

## Libraries used

- Knex
- Express
- Swagger
- Advanced-settings

## Roadmap

- Unit test & coverage
- Security
- Nested relationships
- Improve swagger data types
- Blue and green for maintenance

## License

[MIT](./LICENSE)

## Contributors

<table>
  <tbody>
    <td>
      <img src="https://i.ibb.co/88Tp6n5/Recurso-7.png" width="100px;"/>
      <br />
      <label><a href="https://github.com/TacEtarip">Luis Huertas</a></label>
      <br />
    </td>
    <td>
      <img src="https://avatars0.githubusercontent.com/u/3322836?s=460&v=4" width="100px;"/>
      <br />
      <label><a href="http://jrichardsz.github.io/">JRichardsz</a></label>
      <br />
    </td>
  </tbody>
</table>
