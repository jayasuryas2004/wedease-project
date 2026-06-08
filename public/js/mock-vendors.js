/**
 * Mock vendor data for testing the booking and payment system
 */

const mockVendors = [
  {
    _id: "v1",
    name: "Luxury Palace",
    category: "venue",
    description: "A beautiful venue for your special day with elegant decor and spacious halls.",
    address: {
      street: "123 Wedding Lane",
      city: "Mumbai",
      state: "Maharashtra",
      zipCode: "400001",
      country: "India"
    },
    contact: {
      phone: "+91 9876543210",
      email: "info@luxurypalace.com",
      website: "https://luxurypalace.com"
    },
    pricing: {
      basePrice: 50000,
      currency: "INR",
      packages: [
        {
          name: "Silver Package",
          description: "Basic venue with standard decorations",
          price: 75000,
          includes: ["Venue for 6 hours", "Basic decoration", "Seating for 100 guests"]
        },
        {
          name: "Gold Package",
          description: "Premium venue with elegant decorations and catering",
          price: 125000,
          includes: ["Venue for 8 hours", "Premium decoration", "Seating for 200 guests", "Basic catering"]
        },
        {
          name: "Platinum Package",
          description: "Luxury venue with exclusive decorations, catering, and photography",
          price: 200000,
          includes: ["Venue for 12 hours", "Luxury decoration", "Seating for 300 guests", "Premium catering", "Photography"]
        }
      ]
    },
    images: [
      {
        url: "/images/venues/venue1.jpg",
        caption: "Main Hall"
      },
      {
        url: "/images/venues/venue2.jpg",
        caption: "Garden Area"
      },
      {
        url: "/images/venues/venue3.jpg",
        caption: "Dining Space"
      }
    ],
    averageRating: 4.7,
    reviews: [
      {
        userId: "John & Sarah",
        rating: 5,
        comment: "Amazing venue! Our wedding was perfect thanks to the wonderful staff and beautiful location.",
        date: "2024-12-15"
      },
      {
        userId: "Rahul & Priya",
        rating: 4.5,
        comment: "Great experience overall. The venue was beautiful and the staff was very helpful.",
        date: "2024-11-20"
      }
    ],
    featured: true
  },
  {
    _id: "v2",
    name: "Royal Photography",
    category: "photography",
    description: "Capture your special moments with our professional photography services.",
    address: {
      street: "456 Camera Street",
      city: "Delhi",
      state: "Delhi",
      zipCode: "110001",
      country: "India"
    },
    contact: {
      phone: "+91 9876543211",
      email: "info@royalphotography.com",
      website: "https://royalphotography.com"
    },
    pricing: {
      basePrice: 25000,
      currency: "INR",
      packages: [
        {
          name: "Basic Package",
          description: "4 hours of photography coverage",
          price: 30000,
          includes: ["4 hours coverage", "100 edited photos", "Online gallery"]
        },
        {
          name: "Standard Package",
          description: "8 hours of photography coverage with album",
          price: 50000,
          includes: ["8 hours coverage", "300 edited photos", "Online gallery", "Printed album"]
        },
        {
          name: "Premium Package",
          description: "Full day coverage with video and album",
          price: 80000,
          includes: ["12 hours coverage", "500 edited photos", "Online gallery", "Printed album", "Highlight video"]
        }
      ]
    },
    images: [
      {
        url: "/images/photography/photo1.jpg",
        caption: "Wedding Portrait"
      },
      {
        url: "/images/photography/photo2.jpg",
        caption: "Ceremony"
      },
      {
        url: "/images/photography/photo3.jpg",
        caption: "Reception"
      }
    ],
    averageRating: 4.9,
    reviews: [
      {
        userId: "Amit & Neha",
        rating: 5,
        comment: "The photos were absolutely stunning! They captured every special moment perfectly.",
        date: "2024-10-05"
      },
      {
        userId: "Vikram & Priya",
        rating: 4.8,
        comment: "Professional service and beautiful photos. Highly recommend!",
        date: "2024-09-12"
      }
    ],
    featured: true
  }
];

// Function to get a vendor by ID
function getVendorById(id) {
  return mockVendors.find(vendor => vendor._id === id) || null;
}

// Function to get all vendors
function getAllVendors() {
  return mockVendors;
}

// Function to get vendors by category
function getVendorsByCategory(category) {
  return mockVendors.filter(vendor => vendor.category === category);
}
