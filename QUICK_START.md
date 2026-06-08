# 🚀 Quick Start Guide - Wedease New Features

## How to Use the New Features

### 1. 📍 Location System (Automatic)

**User Experience:**
```
1. Open homepage → Location modal appears automatically
2. Click "Detect My Location" OR search manually
3. Location badge in header shows selected city
4. Click badge anytime to change city
```

**For Developers:**
```javascript
// Check current city
const city = localStorage.getItem('wedease_city');

// Listen for city changes
window.addEventListener('cityChanged', (e) => {
  console.log('New city:', e.detail.city);
});
```

---

### 2. 🏢 Vendor Registration

**Access:** Visit `/vendor-register.html`

**Steps:**
1. **Step 1 - Business Info**: Name, Category, City, Description
2. **Step 2 - Services**: Select services, add pricing
3. **Step 3 - Portfolio**: Drag & drop up to 10 images (5MB each)
4. **Step 4 - Verification**: Contact details, business info

**API Call:**
```javascript
fetch('/api/vendors/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(vendorData)
})
```

---

### 3. 💌 E-Invites HD Download

**Access:** Visit `/e-invites.html`

**Features:**
- Fill invitation form
- Click "Generate Preview"
- Click **Download** → Choose size:
  - 📱 Story (1080×1920)
  - ⬜ Square (1080×1080)
  - 🖥️ Landscape (1920×1080)
  - 🖨️ Print (2480×3508)

**Features:**
- Fill invitation form
- Click "Generate Preview"
- Click **Share** → Choose platform:
  - 💬 WhatsApp (with message)
  - 📱 WhatsApp Status (auto-download)
  - 📘 Facebook
  - 🐦 Twitter
  - 📧 Email
  - 📋 Copy message

---

## 🔧 Configuration

### Location Service Cities
Edit `public/js/location-service.js`:
```javascript
const cities = [
  { name: 'Mumbai', state: 'Maharashtra' },
  { name: 'Delhi', state: 'Delhi' },
  // Add more cities...
];
```

### Vendor Categories
Edit `server/models/Vendor.js`:
```javascript
category: {
  enum: ['venue', 'photography', 'makeup', 'decor', 'catering'],
  // Add more categories...
}
```

### File Upload Limits
Edit `public/js/vendor-registration.js`:
```javascript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 10; // Max images
```

---

## 🎯 Testing Checklist

### Location System:
- [ ] Modal appears on first visit
- [ ] GPS detection works
- [ ] Manual search works
- [ ] City persists after refresh
- [ ] Badge updates correctly

### Vendor Registration:
- [ ] Form validation works
- [ ] Image upload works (drag & drop)
- [ ] Multi-step navigation works
- [ ] API submission succeeds
- [ ] Success message appears

### E-Invites:
- [ ] Form generates preview
- [ ] Download shows 4 sizes
- [ ] All sizes download correctly
- [ ] Share modal opens
- [ ] WhatsApp share works
- [ ] Message copies to clipboard

---

## 🐛 Troubleshooting

### Location not detecting?
```javascript
// Check GPS permission
navigator.permissions.query({ name: 'geolocation' })
  .then(result => console.log(result.state));
```

### Vendor registration fails?
```javascript
// Check server logs
// Verify MongoDB connection
// Check validation errors in browser console
```

### E-Invites not downloading?
```javascript
// Check browser console for errors
// Verify html2canvas library loaded
// Try a different browser
```

---

## 📱 Mobile Testing

Test on actual devices:
- iOS Safari
- Android Chrome
- Responsive design view
- Touch interactions
- GPS on mobile

---

## 🔒 Security Notes

- All inputs sanitized
- XSS protection enabled
- File size limits enforced
- Email uniqueness checked
- Vendor status defaults to 'pending'

---

## 📊 Analytics (Optional)

Track these events:
```javascript
// Location selection
gtag('event', 'location_selected', { city: cityName });

// Vendor registration
gtag('event', 'vendor_registered', { category: category });

// E-Invite download
gtag('event', 'invite_downloaded', { size: sizeName });

// E-Invite share
gtag('event', 'invite_shared', { platform: platform });
```

---

## 🎨 Customization

### Change Colors:
Edit `public/css/location-vendor.css`:
```css
/* Primary gold */
--primary-gold: #d4af37;
--light-gold: #f0c14b;

/* Dark theme */
--dark-bg: #1a1a2e;
--dark-accent: #16213e;
```

### Change Animations:
```css
/* Speed up/slow down */
animation: modalSlideIn 0.4s ease;
                      /* ^^^^ Change this */
```

---

## 🚀 Deployment

1. **Build** (if using build tools)
2. **Environment Variables**:
   ```
   MONGODB_URI=your_mongo_connection
   PORT=9876
   ```
3. **Start Server**:
   ```bash
   npm start
   ```
4. **Test All Features**
5. **Monitor Logs**

---

## 📞 Contact

Need help? Check:
- `IMPLEMENTATION_SUMMARY.md` - Full documentation
- Code comments in each file
- Browser console for errors
- Server logs for API issues

---

**Happy Coding! 🎉**
