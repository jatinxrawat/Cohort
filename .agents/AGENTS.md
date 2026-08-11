# Custom Agent Rules for Cohort

## Sitemap Management Rule
- Whenever creating a new public-facing page (such as a public feature, information page, landing page layout, or article/blog post), you MUST automatically append the new canonical URL to `public/sitemap.xml` with appropriate prioritization and crawl frequency. Do not wait for the user to request it. Private/authenticated routes (guarded by `ProtectedRoute`) must NOT be added to the sitemap.
