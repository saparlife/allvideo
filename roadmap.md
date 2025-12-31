# UnlimVideo Roadmap

## Planned Features

### Domain Restriction for Videos
**Priority:** Medium
**Complexity:** Medium

Allow users to restrict which domains can embed/play their videos.

**Implementation options:**
1. **Signed URLs with expiration** (Recommended)
   - R2 supports signed URLs natively
   - No additional infrastructure costs
   - URLs expire after set time
   - Can include domain validation in signature

2. **Cloudflare Worker** (Expensive at scale)
   - Check Referer header against allowed domains
   - ~$7,500-15,000/month at 1000 clients × 10K views/day
   - Not recommended for high volume

**Database changes:**
```sql
ALTER TABLE videos ADD COLUMN allowed_domains text[] DEFAULT NULL;
-- NULL = all domains allowed
-- ['example.com'] = only these domains
```

**UI:**
- Checkbox "Restrict playback to specific domains"
- Input field for allowed domains list
