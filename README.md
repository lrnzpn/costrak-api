# Costrak API

A comprehensive cost tracking RESTful API service built with Express, TypeScript, Zod, and Supabase.

## Features

- 📊 Track budgets by category and time period
- 💰 Record and categorize expenses
- 📈 Generate spending reports and summaries
- 🔒 Secure API with input validation and error handling
- 📱 Ready for frontend integration

## Tech Stack

- **Framework**: Express.js with TypeScript
- **Database**: Supabase (PostgreSQL)
- **Validation**: Zod schema validation
- **Testing**: Vitest for unit testing
- **CI/CD**: GitHub Actions workflow
- **Deployment**: Ready for Render deployment

## Prerequisites

- Bun v1.0 or higher
- Supabase account for database

## Getting Started

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd costrak-api
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```
# Copy from .env.example
cp .env.example .env
```

Update the `.env` file with your Supabase credentials:

```
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Execute the SQL schema from `src/config/schema.sql` in the Supabase SQL editor
3. Create appropriate policies as per your authentication needs

### 4. Install dependencies

```bash
bun install
```

### 5. Run the development server

```bash
bun dev
```

The server will start on port 3000 (or as specified in your .env file).

## API Endpoints

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get a specific category
- `POST /api/categories` - Create a new category
- `PATCH /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

### Budgets

- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/summary` - Get budget summary with remaining amounts
- `GET /api/budgets/:id` - Get a specific budget
- `POST /api/budgets` - Create a new budget
- `PATCH /api/budgets/:id` - Update a budget
- `DELETE /api/budgets/:id` - Delete a budget

### Expenses

- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/summary` - Get expense summary by category
- `GET /api/expenses/:id` - Get a specific expense
- `POST /api/expenses` - Create a new expense
- `PATCH /api/expenses/:id` - Update an expense
- `DELETE /api/expenses/:id` - Delete an expense

## Testing

Run the test suite:

```bash
bun test
```

Run tests with coverage:

```bash
bun test:coverage
```

## Deployment

This project is set up for deployment to Render with the included `render.yaml` file.

1. Connect your GitHub repository to Render
2. Set up the environment variables in Render dashboard
3. Deploy the service

## CI/CD

The repository includes GitHub Actions workflows for:
- Running tests on pull requests
- Building and deploying to Render on merge to main branch

## License

MIT
