-- Optional: pre-fills the products table with the 8 pieces already shown on
-- your homepage, so the site isn't empty the moment you switch it on.
-- Prices are placeholders (₦85,000) — edit real prices in /admin.html.
-- Sizes are a placeholder guess (UK 10–16) — edit to match what you stock.

INSERT INTO products (name, color, category, description, price_kobo, image_url, sizes, stock_quantity, is_active) VALUES
('Navy Peplum Skirt Suit', 'Navy', 'Skirt suit', 'Peplum blazer with a matching pencil skirt.', 8500000, 'assets/suit-navy-01.jpeg', ARRAY['UK 10','UK 12','UK 14','UK 16'], 5, true),
('Royal Blue Peplum Skirt Suit', 'Royal Blue', 'Skirt suit', 'Fitted blazer, peplum waist, matching skirt.', 8500000, 'assets/suit-royalblue-01.jpeg', ARRAY['UK 10','UK 12','UK 14','UK 16'], 5, true),
('Black Skirt Suit', 'Black', 'Skirt suit', 'A tailored staple for the office wardrobe.', 8500000, 'assets/suit-black-03.jpeg', ARRAY['UK 10','UK 12','UK 14','UK 16'], 5, true),
('Chocolate Skirt Suit', 'Chocolate', 'Skirt suit', 'A warmer neutral, cut the same tailored way.', 8500000, 'assets/suit-brown-01.jpeg', ARRAY['UK 10','UK 12','UK 14','UK 16'], 5, true),
('Camel Double-Breasted Pantsuit', 'Camel', 'Pantsuit', 'Double-breasted blazer with straight-leg trousers.', 9500000, 'assets/suit-camel-01.jpeg', ARRAY['UK 10','UK 12','UK 14','UK 16'], 5, true),
('Wine Pantsuit', 'Wine', 'Pantsuit', 'A deeper tone for standing out in a room of black and navy.', 9500000, 'assets/suit-wine-01.jpeg', ARRAY['UK 10','UK 12','UK 14','UK 16'], 5, true),
('Forest Green Belted Set', 'Forest Green', 'Belted set', 'Double-breasted, self-tie waist, wide-leg trousers.', 9800000, 'assets/suit-green-01.jpeg', ARRAY['UK 10','UK 12','UK 14','UK 16'], 5, true),
('Teal Belted Set', 'Teal', 'Belted set', 'Same tailored silhouette, in a bolder colourway.', 9800000, 'assets/suit-teal-01.jpeg', ARRAY['UK 10','UK 12','UK 14','UK 16'], 5, true);
