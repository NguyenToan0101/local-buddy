BEGIN;

-- No existing traveler/user UUID was found in project seed files or database scripts.
-- This traveler_id must exist in users(id) if foreign key constraints are enabled.

INSERT INTO experiences (
    id,
    traveler_id,
    buddy_id,
    title,
    story_content,
    location,
    rating,
    tags,
    is_pinned,
    created_at
) VALUES
(
    '1cc78b72-6b36-42ea-a164-7ddad08599de',
    '55ebae01-bb9b-4553-9da7-930787063ba9',
    'fc6d582c-aee9-4d81-b922-50efdc312257',
    'Magical Evening in Hoi An',
    'I never thought making a lantern could be so therapeutic! Quoc Bao (my buddy) showed me the hidden workshop of a master craftsman. We spent hours talking about Hoi An''s history over tea while the silk took shape. It wasn''t just a tour; it was a real connection to the soul of the city. If you''re in Hoi An, you HAVE to find Quoc Bao!',
    'Hoi An, Vietnam',
    5,
    ARRAY['Culture', 'Craft', 'Hoi An']::varchar[],
    false,
    now()
),
(
    '829dc592-b7ec-43ce-9077-1c8079c73af4',
    '55ebae01-bb9b-4553-9da7-930787063ba9',
    'fc6d582c-aee9-4d81-b922-50efdc312257',
    'Hidden Flavors of the Old Quarter',
    'Hanoi''s street food can be overwhelming, but Sarah (yes, we have the same name!) made it feel like a dinner party with an old friend. We skipped the ''tourist'' places and sat on tiny plastic stools for the best Bun Cha I''ve ever tasted. Her stories about growing up in these alleys made every bite meaningful. Best decision ever!',
    'Hanoi, Vietnam',
    4.9,
    ARRAY['Food', 'Local Life', 'Hanoi']::varchar[],
    false,
    now()
),
(
    '50a09f8f-7b3e-4409-8b36-379757448f4a',
    '55ebae01-bb9b-4553-9da7-930787063ba9',
    'fc6d582c-aee9-4d81-b922-50efdc312257',
    'Morning Market & Coffee Secrets',
    'Linh took me to the early morning market before the sun was even fully up. Seeing the city wake up and learning about the ingredients used in traditional Hanoi dishes was eye-opening. We finished with the most incredible egg coffee in a hidden courtyard. She''s not just a guide, she''s like a local sister showing you her home.',
    'Hanoi, Vietnam',
    5,
    ARRAY['Market', 'Coffee', 'Culture']::varchar[],
    false,
    now()
),
(
    'ae61fe41-fd4d-46af-9e6d-ee6e4825b823',
    '55ebae01-bb9b-4553-9da7-930787063ba9',
    'fc6d582c-aee9-4d81-b922-50efdc312257',
    'Breathtaking Sunset over the Bay',
    'Watching the sun dip below the karsts of Ha Long was peak existence. My buddy Minh Nhat knew exactly when and where to go to avoid the massive cruise ship crowds. We had a small private boat, cold drinks, and perfect silence. His local knowledge about the bay''s formations was incredible.',
    'Ha Long Bay, Vietnam',
    5,
    ARRAY['Nature', 'Cruise', 'Ha Long']::varchar[],
    false,
    now()
),
(
    '8d6c60d2-37a8-4a73-8094-ab480fbc232c',
    '55ebae01-bb9b-4553-9da7-930787063ba9',
    'fc6d582c-aee9-4d81-b922-50efdc312257',
    'Saigon Coffee Culture Exploration',
    'Nam showed me the most amazing hidden coffee spots in Saigon. From apartment cafes to street-side drip coffee, every stop had a story. His knowledge of the city''s architecture and history made the tour so much more than just about coffee.',
    'Ho Chi Minh City, Vietnam',
    4.8,
    ARRAY['Coffee', 'Saigon', 'History']::varchar[],
    false,
    now()
),
(
    'ecb6e7e8-8926-4c6d-9e07-c09f45d1fd09',
    '55ebae01-bb9b-4553-9da7-930787063ba9',
    'fc6d582c-aee9-4d81-b922-50efdc312257',
    'Sapa Terraced Fields Trekking',
    'Thuy Tien is an amazing guide! She took us on a trek through the most beautiful terraced fields I''ve ever seen. We visited local ethnic minority villages and learned so much about their culture. A truly authentic experience.',
    'Lao Cai, Vietnam',
    5,
    ARRAY['Trekking', 'Nature', 'Sapa']::varchar[],
    false,
    now()
);

INSERT INTO experience_images (
    id,
    experience_id,
    image_url,
    display_order,
    created_at
) VALUES
(
    'bbfbc3b0-2074-4fab-9e86-07379281dc50',
    '1cc78b72-6b36-42ea-a164-7ddad08599de',
    '/assets/img/hoian.jpg',
    0,
    now()
),
(
    '0d9b737e-99ff-477c-9ba2-ec4f81275fa1',
    '829dc592-b7ec-43ce-9077-1c8079c73af4',
    '/assets/auth/hanoi.png',
    0,
    now()
),
(
    '08769034-b876-46dc-a1fe-125cda27287e',
    '50a09f8f-7b3e-4409-8b36-379757448f4a',
    '/assets/auth/hanoi.png',
    0,
    now()
),
(
    '50357e89-775b-455f-9a51-6f32ed85d5f4',
    'ae61fe41-fd4d-46af-9e6d-ee6e4825b823',
    'https://images.unsplash.com/photo-1524397057410-1e775ed476f3?auto=format&fit=crop&q=80&w=800',
    0,
    now()
),
(
    '7605f13d-e9eb-4262-89dc-5c2f4525609e',
    '8d6c60d2-37a8-4a73-8094-ab480fbc232c',
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&q=80&w=800',
    0,
    now()
),
(
    '799f6cb3-35c1-40c2-a162-de6a415d5a74',
    'ecb6e7e8-8926-4c6d-9e07-c09f45d1fd09',
    'https://images.unsplash.com/photo-1502252430442-aac78f397426?auto=format&fit=crop&q=80&w=800',
    0,
    now()
);

COMMIT;
