# Transition Early Access Function

This edge function automatically transitions users from `early_access` status to `free_trial` status when their early access period expires.

## What it does

1. Finds all users with status `early_access` whose `early_access_end_date` has passed
2. Updates their status to `free_trial`
3. Sets `trial_start_date` to current date
4. Sets `trial_end_date` to 14 days from current date

## Setup

This function is configured to run daily via a cron job. The cron job is set up using the SQL in the migrations.

## Manual Invocation

You can also invoke this function manually if needed via the Supabase dashboard or using curl.
