-- Read-only: potret skema schema "public" dalam SATU sel JSON, untuk
-- membandingkan database PROD dan DEV. Tidak mengubah apa pun; aman
-- dijalankan kapan saja di SQL Editor Supabase.
--
-- Isi: kolom tiap tabel (tipe, NOT NULL, default), constraint (PK, UNIQUE,
-- CHECK, FK), index, status RLS, dan policy. Kunci JSON diurutkan otomatis,
-- jadi hasil prod dan dev bisa langsung di-diff.
--
-- Cara pakai: jalankan di project PROD, salin sel hasilnya; ulangi di DEV;
-- lalu bandingkan keduanya.

SELECT jsonb_pretty(jsonb_build_object(
    'columns', (
        SELECT jsonb_object_agg(table_name, cols)
        FROM (
            SELECT c.table_name,
                   jsonb_agg(
                       c.column_name || ' ' || c.data_type
                       || CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END
                       || COALESCE(' DEFAULT ' || c.column_default, '')
                       ORDER BY c.ordinal_position
                   ) AS cols
            FROM information_schema.columns c
            JOIN information_schema.tables t
              ON t.table_schema = c.table_schema AND t.table_name = c.table_name
            WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
            GROUP BY c.table_name
        ) x
    ),
    'constraints', (
        SELECT jsonb_object_agg(table_name, defs)
        FROM (
            SELECT cl.relname AS table_name,
                   jsonb_agg(pg_get_constraintdef(con.oid) ORDER BY pg_get_constraintdef(con.oid)) AS defs
            FROM pg_constraint con
            JOIN pg_class cl ON cl.oid = con.conrelid
            JOIN pg_namespace ns ON ns.oid = cl.relnamespace
            WHERE ns.nspname = 'public'
            GROUP BY cl.relname
        ) y
    ),
    'indexes', (
        SELECT jsonb_object_agg(tablename, defs)
        FROM (
            SELECT tablename,
                   jsonb_agg(regexp_replace(indexdef, 'INDEX \S+ ON', 'INDEX ON') ORDER BY indexdef) AS defs
            FROM pg_indexes
            WHERE schemaname = 'public'
            GROUP BY tablename
        ) z
    ),
    'rls_enabled', (
        SELECT jsonb_object_agg(cl.relname, cl.relrowsecurity)
        FROM pg_class cl
        JOIN pg_namespace ns ON ns.oid = cl.relnamespace
        WHERE ns.nspname = 'public' AND cl.relkind = 'r'
    ),
    'policies', (
        SELECT jsonb_object_agg(tablename, pols)
        FROM (
            SELECT tablename,
                   jsonb_agg(
                       cmd || ' TO ' || array_to_string(roles, ',')
                       || COALESCE(' USING ' || qual, '')
                       || COALESCE(' CHECK ' || with_check, '')
                       ORDER BY cmd, array_to_string(roles, ','), COALESCE(qual, ''), COALESCE(with_check, '')
                   ) AS pols
            FROM pg_policies
            WHERE schemaname = 'public'
            GROUP BY tablename
        ) p
    )
)) AS schema_snapshot;
