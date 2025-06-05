-- Users table (optional if using Supabase Auth)
create table if not exists users (
  id uuid primary key default auth.uid(),
  email text not null unique,
  name text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Categories table
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  user_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  unique(name, user_id)
);

-- Create some default categories
insert into categories (name, description) values 
  ('Housing', 'Rent, mortgage, repairs, property taxes'),
  ('Transportation', 'Car payments, gas, public transit, vehicle maintenance'),
  ('Food', 'Groceries, restaurants, take-out'),
  ('Utilities', 'Electricity, water, gas, internet, phone'),
  ('Insurance', 'Health, auto, home, life insurance'),
  ('Healthcare', 'Doctor visits, prescriptions, medical procedures'),
  ('Entertainment', 'Movies, concerts, subscriptions, hobbies'),
  ('Personal Care', 'Haircuts, gym, clothing, laundry'),
  ('Education', 'Tuition, books, courses'),
  ('Debt Payments', 'Credit cards, student loans, personal loans'),
  ('Savings', 'Emergency fund, retirement, investments'),
  ('Miscellaneous', 'Other expenses that don\'t fit in other categories')
on conflict do nothing;

-- Budgets table
create table if not exists budgets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  amount decimal not null check (amount >= 0),
  start_date date not null,
  end_date date not null,
  category_id uuid references categories(id) on delete set null,
  user_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  check (end_date >= start_date)
);

-- Expenses table
create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(),
  amount decimal not null check (amount >= 0),
  description text not null,
  date date not null default current_date,
  category_id uuid references categories(id) on delete set null,
  budget_id uuid references budgets(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

-- Health check table for connection testing
create table if not exists health_check (
  id serial primary key,
  timestamp timestamp with time zone default now() not null
);

-- Enable Row Level Security (RLS)
alter table categories enable row level security;
alter table budgets enable row level security;
alter table expenses enable row level security;

-- Create policies so users can only access their own data
create policy "Users can only access their own categories"
  on categories for all
  using (user_id = auth.uid());

create policy "Users can only access their own budgets"
  on budgets for all
  using (user_id = auth.uid());

create policy "Users can only access their own expenses"
  on expenses for all
  using (user_id = auth.uid());

-- Create functions for summary reports
create or replace function get_budget_summary(user_uuid uuid, period_start date, period_end date)
returns table (
  category_name text,
  budget_amount decimal,
  expenses_amount decimal,
  remaining decimal
)
language plpgsql
as $$
begin
  return query
  select 
    c.name as category_name,
    coalesce(b.amount, 0) as budget_amount,
    coalesce(sum(e.amount), 0) as expenses_amount,
    coalesce(b.amount, 0) - coalesce(sum(e.amount), 0) as remaining
  from categories c
  left join budgets b on c.id = b.category_id 
    and b.user_id = user_uuid
    and b.start_date <= period_end 
    and b.end_date >= period_start
  left join expenses e on c.id = e.category_id 
    and e.user_id = user_uuid
    and e.date >= period_start 
    and e.date <= period_end
  where c.user_id = user_uuid or c.user_id is null
  group by c.name, b.amount
  order by c.name;
end;
$$;
