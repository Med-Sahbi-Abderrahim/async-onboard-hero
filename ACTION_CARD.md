# 🎯 ACTION CARD - NEXT 3 STEPS

**Current Status:** Code deployed to GitHub | Migration ready | Application ready

---

## 🚀 STEP 1: Apply Migration (RIGHT NOW - 5 minutes)

### Do This Now:

1. **Open browser:** https://app.supabase.com

2. **Select project:** async-onboard-hero

3. **Click:** SQL Editor → New Query

4. **Copy this SQL:**

```sql
-- Add soft-delete support to organization_members table
-- This enables audit trail and recovery capabilities for team member removals

ALTER TABLE public.organization_members 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Create index for efficient filtering of active members
CREATE INDEX IF NOT EXISTS idx_organization_members_deleted_at 
ON public.organization_members(deleted_at);

-- Update RLS policies to respect soft-delete in member queries
DROP POLICY IF EXISTS "Members can view org members" ON public.organization_members;

CREATE POLICY "Members can view org members"
ON public.organization_members
FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    SELECT EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = organization_members.organization_id
      AND om.deleted_at IS NULL
    )
  )
);

-- Update activity logs to capture soft-deletes properly
DROP POLICY IF EXISTS "Members can view activity logs" ON public.activity_logs;

CREATE POLICY "Members can view activity logs"
ON public.activity_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members om
    WHERE om.organization_id = activity_logs.organization_id
    AND om.user_id = auth.uid()
    AND om.deleted_at IS NULL
  )
);
```

5. **Paste into SQL Editor**

6. **Click:** Run button (or Ctrl+Enter)

7. **Verify:** See ✅ "Query executed successfully"

---

## ✅ STEP 2: Verify Success (After Step 1 - 2 minutes)

### In Same SQL Editor, Run:

**Query 1:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'organization_members' 
AND column_name = 'deleted_at';
```

**Expected:** `deleted_at | timestamp with time zone` ✅

**Query 2:**
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'organization_members' 
AND indexname = 'idx_organization_members_deleted_at';
```

**Expected:** `idx_organization_members_deleted_at` ✅

---

## 🚀 STEP 3: Deploy Application (After Step 2)

### In Terminal:

```bash
cd c:\Users\clubi\async-onboard-hero
npm run build
```

### Expected Output:
```
✓ 3171 modules transformed
✓ built in X.XXs
```

### Then:
**Deploy to your hosting platform:**
- Vercel: Auto-deploys from GitHub
- Netlify: Auto-deploys from GitHub
- Manual: Upload `dist/` folder

### Test:
1. Delete a team member
2. Member disappears from list ✅
3. No errors in logs ✅

---

## 📞 Issues?

**Can't find SQL Editor?**
- Supabase Dashboard → Left sidebar → SQL Editor

**Got an error?**
- See: APPLY_MIGRATION_VIA_DASHBOARD.md (Troubleshooting section)

**Need help?**
- Read: APPLY_MIGRATION_VIA_DASHBOARD.md (Complete guide)

---

## ✨ What Happens After You Complete All 3 Steps

✅ **Soft-Delete System Live**
✅ **Audit Trail Active**
✅ **Data Recovery Enabled**
✅ **No More Data Loss**

---

**Status:** Ready to go! Start with Step 1 now! 🚀
