-- Klagon Map — stays-first pivot: dedicated `stay` entity type.
--
-- Single statement on purpose: ALTER TYPE ... ADD VALUE must not share a
-- transaction with statements that use the new value.

alter type public.map_entity_type add value if not exists 'stay';
