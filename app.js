const express = require("express");
const app = express();
const path = require("path");
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const { format, parseISO } = require("date-fns/fp");
const dbPath = path.join(__dirname, "todoApplication.db");

let database = null;

const initializeDatabase = async () => {
  try {
    database = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDatabase();

const hasPriorityValue = (request) => {
  return request.priority !== undefined;
};

const hasStatusValue = (request) => {
  return request.status !== undefined;
};

const hasPriorityAndStatusValue = (request) => {
  return request.status !== undefined && request.priority !== undefined;
};
const hasCategoryAndStatusValue = (request) => {
  return request.category !== undefined && request.status !== undefined;
};

const hasCategoryValue = (request) => {
  return request.category !== undefined;
};
const hasPriorityAndCategoryValue = (request) => {
  return request.priority !== undefined && request.category !== undefined;
};

const hasTodoValue = (request) => {
  return request.todo !== undefined;
};

app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "", category } = request.query;

  let dbQuery;
  let data = null;
  switch (true) {
    case hasPriorityValue(request.query):
      if (
        (priority === "HIGH") ^
        (priority === "LOW") ^
        (priority === "MEDIUM")
      ) {
        dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}' ORDER BY id;`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;
    case hasStatusValue(request.query):
      if (
        (status === "TO DO") ^
        (status === "IN PROGRESS") ^
        (status === "DONE")
      ) {
        dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasPriorityAndStatusValue(request.query):
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}' AND status='${status}';`;
      break;
    case hasCategoryAndStatusValue(request.query):
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}' AND status='${status}';`;
      break;
    case hasPriorityAndCategoryValue(request.query):
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}' AND category='${category}';`;
      break;
    case hasCategoryValue(request.query):
      if (
        (category === "WORK") ^
        (category === "HOME") ^
        (category === "LEARNING")
      ) {
        dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND category='${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }

      break;
    default:
      dbQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }
  const dbQueryResponse = await database.all(dbQuery);
  response.send(dbQueryResponse);
});

app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const todoIdQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  const todoResponse = await database.get(todoIdQuery);
  response.send(todoResponse);
});

module.exports = app;
