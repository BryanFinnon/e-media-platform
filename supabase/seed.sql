-- Clearly labelled local development data. No real client, testimonial, event, or editorial claim.
insert into public.site_settings(id, business_name, location, footer_copy)
values(true, 'E-MEDIA', 'London / UK', 'Independent creative studio + media platform')
on conflict (id) do nothing;

insert into public.feature_flags(key, enabled, description) values
('AGENCY_ENABLED', true, 'Public studio and service experience'),
('BOOKING_ENABLED', true, 'Booking and project request flow'),
('PAYMENTS_ENABLED', false, 'Stripe collection after provider configuration'),
('CLIENT_PORTAL_ENABLED', true, 'Authenticated client workspace'),
('MEDIA_HUB_ENABLED', true, 'E-MEDIA Hub shell'),
('LATEST_ENABLED', true, 'Editorial newsroom'),
('WATCH_ENABLED', true, 'Video and show catalogue'),
('LIVE_ENABLED', true, 'Live schedule and playback'),
('COMMUNITY_ENABLED', true, 'Member discussions'),
('OPPORTUNITIES_ENABLED', true, 'Opportunity board'),
('EVENTS_ENABLED', true, 'Events guide'),
('CHAT_ENABLED', true, 'Customer and staff messaging'),
('NEWSLETTER_ENABLED', true, 'Explicit opt-in subscription')
on conflict (key) do update set enabled = excluded.enabled;

insert into public.services(name, slug, service_group, summary, description, booking_mode, pricing_mode, sort_order) values
('Photography', 'photography', 'CREATIVE_PRODUCTION', 'Portraits, campaigns, events and considered visual stories.', 'Development service record. Replace with approved E-MEDIA service copy.', 'REQUEST_TO_BOOK', 'QUOTE', 1),
('Videography', 'videography', 'CREATIVE_PRODUCTION', 'Cinematic moving image for campaigns, social and events.', 'Development service record. Replace with approved E-MEDIA service copy.', 'QUOTE_REQUIRED', 'QUOTE', 2),
('Web development', 'web-development', 'DIGITAL_TECHNOLOGY', 'Fast, accessible digital products built around real organisational needs.', 'Development service record. Replace with approved E-MEDIA service copy.', 'DISCOVERY_CALL', 'QUOTE', 3),
('Graphic design', 'graphic-design', 'BRAND_CONTENT', 'Identity and campaign design with clarity and character.', 'Development service record. Replace with approved E-MEDIA service copy.', 'REQUEST_TO_BOOK', 'QUOTE', 4)
on conflict (slug) do nothing;

insert into public.article_categories(name, slug, description, sort_order) values
('Culture', 'culture', 'Development category for London culture coverage.', 1),
('People', 'people', 'Development category for profiles and interviews.', 2),
('Ideas', 'ideas', 'Development category for reported ideas and analysis.', 3)
on conflict (slug) do nothing;

insert into public.forum_categories(name, slug, description, sort_order) values
('Introductions', 'introductions', 'A moderated place for new members to introduce themselves without sharing private information.', 1),
('Creative practice', 'creative-practice', 'Discuss process, craft and responsible feedback.', 2),
('Opportunities', 'opportunities', 'Discuss verified opportunities and application craft.', 3)
on conflict (slug) do nothing;
