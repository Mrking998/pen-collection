ALTER TABLE products ADD COLUMN images_json TEXT NOT NULL DEFAULT '[]';

UPDATE products
SET images_json = CASE
  WHEN image_url IS NULL OR image_url = '' THEN '[]'
  ELSE json_array(image_url)
END;
