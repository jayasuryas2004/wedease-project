document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const inviteForm = document.getElementById('invite-form');
    const previewBtn = document.querySelector('.submit-btn.preview-btn');
    const downloadBtn = document.querySelector('.preview-btn.download-btn');
    const shareBtn = document.querySelector('.preview-btn.share-btn');
    const resetBtn = document.querySelector('.preview-btn.reset-btn');
    const previewContainer = document.getElementById('invitation-preview-container');
    const templateSelector = document.getElementById('template-selector');
    const templatePreviewContainer = document.getElementById('template-preview');
    const loadingSpinner = document.createElement('div');
    
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i><p>Generating your invitation...</p>';
    
    // Initialize
    fetchTemplates();
    
    // Event listeners
    if (previewBtn) {
        previewBtn.addEventListener('click', generatePreview);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetForm);
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadInvite);
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', shareInvite);
    }
    
    if (templateSelector) {
        templateSelector.addEventListener('change', showTemplatePreview);
    }
    
    // Functions
    function fetchTemplates() {
        fetch('/api/invites/templates')
            .then(response => response.json())
            .then(data => {
                // Clear existing options except the default one
                templateSelector.innerHTML = '<option value="">Select a template</option>';
                
                // Add template options
                data.templates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = template.name;
                    option.dataset.description = template.description;
                    option.dataset.imageUrl = template.imageUrl;
                    option.dataset.theme = template.theme;
                    templateSelector.appendChild(option);
                });
                
                // Add info notice
                const infoNotice = document.createElement('div');
                infoNotice.className = 'template-info-notice';
                infoNotice.innerHTML = '<p><i class="fas fa-info-circle"></i> Select a template to see a preview</p>';
                templatePreviewContainer.innerHTML = '';
                templatePreviewContainer.appendChild(infoNotice);
            })
            .catch(error => {
                console.error('Error fetching templates:', error);
                templatePreviewContainer.innerHTML = 
                    '<div class="error-message">' +
                    '<i class="fas fa-exclamation-circle"></i>' +
                    '<p>Failed to load templates. Please refresh the page.</p>' +
                    '</div>';
            });
    }
    
    function showTemplatePreview() {
        const selectedOption = templateSelector.options[templateSelector.selectedIndex];
        
        if (selectedOption.value === '') {
            // No template selected, show info message
            templatePreviewContainer.innerHTML = 
                '<div class="template-info-notice">' +
                '<p><i class="fas fa-info-circle"></i> Select a template to see a preview</p>' +
                '</div>';
            return;
        }
        
        // Get template data from the selected option
        const templateId = selectedOption.value;
        const templateName = selectedOption.textContent;
        const templateDescription = selectedOption.dataset.description;
        const templateImageUrl = selectedOption.dataset.imageUrl;
        const templateTheme = selectedOption.dataset.theme;
        
        // Show template preview
        templatePreviewContainer.innerHTML = 
            '<div class="template-preview-card ' + templateTheme + '-theme">' +
            '<img src="' + templateImageUrl + '" alt="' + templateName + ' Template">' +
            '<div class="template-info">' +
            '<h4>' + templateName + '</h4>' +
            '<p>' + templateDescription + '</p>' +
            '</div>' +
            '</div>';
    }
    
    function generatePreview(e) {
        e.preventDefault();
        console.log('Generate preview button clicked');
        
        // Get form values
        const brideName = document.getElementById('bride-name')?.value || '';
        const groomName = document.getElementById('groom-name')?.value || '';
        const coupleName = brideName && groomName ? `${brideName} & ${groomName}` : '';
        const date = document.getElementById('wedding-date')?.value || '';
        const time = document.getElementById('wedding-time')?.value || '';
        const venue = document.getElementById('venue-name')?.value || '';
        const venueAddress = document.getElementById('venue-address')?.value || '';
        const fullVenue = venue + (venueAddress ? `, ${venueAddress}` : '');
        const templateId = templateSelector?.value || '';
        const colorScheme = document.getElementById('color-scheme')?.value || 'gold';
        const customMessage = document.getElementById('custom-message')?.value || 'Join us on our special day!';
        
        console.log('Form values:', { brideName, groomName, coupleName, date, time, venue, venueAddress, fullVenue, templateId, colorScheme });
        
        // Validate required fields
        if (!brideName || !groomName || !date || !venue || !templateId) {
            alert('Please fill in all required fields and select a template');
            console.error('Missing required fields:', { 
                brideName: !!brideName, 
                groomName: !!groomName, 
                date: !!date, 
                venue: !!venue, 
                templateId: !!templateId 
            });
            return;
        }
        
        // Show loading indicator
        previewContainer.innerHTML = '';
        previewContainer.appendChild(loadingSpinner);
        
        // Prepare data for API request
        const inviteData = {
            coupleName,
            date,
            time,
            venue: fullVenue,
            templateId,
            colorScheme,
            customMessage
        };
        
        // Send request to generate invitation
        console.log('Sending API request with data:', inviteData);
        fetch('/api/invites/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(inviteData)
        })
        .then(response => {
            console.log('API response status:', response.status);
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('API error response:', text);
                    throw new Error('Failed to generate invitation: ' + text);
                });
            }
            return response.json().then(data => {
                console.log('API success response:', data);
                return data;
            });
        })
        .then(data => {
            if (data && data.imageUrl) {
                // Format the date nicely
                const eventDate = new Date(date);
                const formattedDate = eventDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                // Create RSVP date (2 weeks before event)
                const rsvpDate = new Date(eventDate);
                rsvpDate.setDate(eventDate.getDate() - 14);
                const formattedRsvpDate = rsvpDate.toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                });
                
                // Display the preview
                previewContainer.innerHTML = 
                    '<div class="invite-preview ' + data.theme + '-theme">' +
                    '<div class="invite-image">' +
                    '<img src="' + data.imageUrl + '" alt="Wedding Invitation">' +
                    '</div>' +
                    '<div class="invite-content">' +
                    '<h2 class="invite-title">Wedding Invitation</h2>' +
                    '<h3 class="invite-couple">' + coupleName + '</h3>' +
                    '<p class="invite-message">' + customMessage + '</p>' +
                    '<div class="invite-details">' +
                    '<p class="invite-date"><i class="far fa-calendar-alt"></i> ' + formattedDate + '</p>' +
                    '<p class="invite-time"><i class="far fa-clock"></i> ' + time + '</p>' +
                    '<p class="invite-venue"><i class="fas fa-map-marker-alt"></i> ' + fullVenue + '</p>' +
                    '</div>' +
                    '<p class="invite-rsvp">Please RSVP by ' + formattedRsvpDate + '</p>' +
                    '</div>' +
                    '</div>';
                
                // Store the invite ID for later use
                if (data.id) {
                    const inviteIdInput = document.createElement('input');
                    inviteIdInput.type = 'hidden';
                    inviteIdInput.id = 'invite-id';
                    inviteIdInput.value = data.id;
                    previewContainer.appendChild(inviteIdInput);
                }
                
                // Enable buttons
                downloadBtn.disabled = false;
                shareBtn.disabled = false;
            } else {
                // Show error if no invitation data
                previewContainer.innerHTML = 
                    '<div class="error-message">' +
                    '<i class="fas fa-exclamation-circle"></i>' +
                    '<p>Could not generate invitation. Please try again.</p>' +
                    '</div>';
            }
        })
        .catch(error => {
            console.error('Error generating invitation:', error);
            previewContainer.innerHTML = 
                '<div class="error-message">' +
                '<i class="fas fa-exclamation-circle"></i>' +
                '<p>' + (error.message || 'Error generating invitation. Please try again.') + '</p>' +
                '</div>';
        });
    }
    
    function resetForm() {
        inviteForm.reset();
        previewContainer.innerHTML = `
            <div class="preview-message" style="text-align: center; padding: 2rem;">
                <i class="fas fa-envelope-open-text" style="font-size: 3.5rem; color: var(--secondary-color); margin-bottom: 1.5rem; display: block;"></i>
                <h3 style="color: var(--secondary-color); font-size: 1.8rem; margin-bottom: 1rem;">Template-Based Invitations</h3>
                <p style="margin-bottom: 1rem; font-size: 1.1rem;">Select a beautiful template and fill in your wedding details.</p>
                <p style="color: #aaa; font-style: italic;">Your personalized invitation will appear here.</p>
                <div style="margin-top: 1.5rem; border-top: 1px dashed var(--secondary-color); padding-top: 1rem;">
                    <span style="background-color: rgba(240, 193, 75, 0.1); padding: 0.5rem 1rem; border-radius: 4px; display: inline-block;">
                        <i class="fas fa-info-circle" style="color: var(--secondary-color); margin-right: 0.5rem;"></i>
                        Updated: May 2025
                    </span>
                </div>
            </div>
        `;
        templatePreviewContainer.innerHTML = 
            '<div class="template-info-notice">' +
            '<p><i class="fas fa-info-circle"></i> Select a template to see a preview</p>' +
            '</div>';
        downloadBtn.disabled = true;
        shareBtn.disabled = true;
    }
    
    function downloadInvite() {
        const invitePreview = document.querySelector('.invite-preview');
        if (!invitePreview) {
            alert('Please generate an invitation first');
            return;
        }
        
        // Create download modal with HD size options
        const downloadModal = document.createElement('div');
        downloadModal.className = 'download-modal';
        downloadModal.innerHTML = `
            <div class="download-modal-content">
                <span class="close-modal">&times;</span>
                <h3><i class="fas fa-download"></i> Download HD Invitation</h3>
                <p class="download-subtitle">Choose your preferred size for the best quality</p>
                
                <div class="download-sizes">
                    <div class="size-option" data-size="story" data-width="1080" data-height="1920">
                        <div class="size-icon">
                            <i class="fas fa-mobile-alt"></i>
                        </div>
                        <div class="size-info">
                            <h4>Story / Portrait</h4>
                            <span class="size-dimensions">1080 × 1920 px</span>
                            <span class="size-use">WhatsApp Status, Instagram Stories</span>
                        </div>
                        <span class="size-badge">Recommended</span>
                    </div>
                    
                    <div class="size-option" data-size="square" data-width="1080" data-height="1080">
                        <div class="size-icon">
                            <i class="fas fa-square"></i>
                        </div>
                        <div class="size-info">
                            <h4>Square</h4>
                            <span class="size-dimensions">1080 × 1080 px</span>
                            <span class="size-use">Instagram Posts, Facebook</span>
                        </div>
                    </div>
                    
                    <div class="size-option" data-size="landscape" data-width="1920" data-height="1080">
                        <div class="size-icon">
                            <i class="fas fa-desktop"></i>
                        </div>
                        <div class="size-info">
                            <h4>Landscape / HD</h4>
                            <span class="size-dimensions">1920 × 1080 px</span>
                            <span class="size-use">Email, Desktop Wallpaper</span>
                        </div>
                    </div>
                    
                    <div class="size-option" data-size="print" data-width="2480" data-height="3508">
                        <div class="size-icon">
                            <i class="fas fa-print"></i>
                        </div>
                        <div class="size-info">
                            <h4>Print Quality (A4)</h4>
                            <span class="size-dimensions">2480 × 3508 px</span>
                            <span class="size-use">High-Quality Printing</span>
                        </div>
                        <span class="size-badge premium">HD</span>
                    </div>
                </div>
                
                <div class="download-progress" style="display: none;">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <p class="progress-text">Generating HD image...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(downloadModal);
        
        // Add modal styles if not already present
        if (!document.getElementById('download-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'download-modal-styles';
            styles.textContent = `
                .download-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .download-modal-content {
                    background: linear-gradient(145deg, #1a1a2e, #16213e);
                    border-radius: 16px;
                    padding: 2rem;
                    max-width: 500px;
                    width: 90%;
                    position: relative;
                    border: 1px solid rgba(240, 193, 75, 0.3);
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                }
                .download-modal-content h3 {
                    color: #f0c14b;
                    margin-bottom: 0.5rem;
                    font-size: 1.5rem;
                }
                .download-modal-content h3 i {
                    margin-right: 0.5rem;
                }
                .download-subtitle {
                    color: #aaa;
                    margin-bottom: 1.5rem;
                }
                .download-modal .close-modal {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    font-size: 1.5rem;
                    color: #aaa;
                    cursor: pointer;
                    transition: color 0.3s;
                }
                .download-modal .close-modal:hover {
                    color: #f0c14b;
                }
                .download-sizes {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                .size-option {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                }
                .size-option:hover {
                    background: rgba(240, 193, 75, 0.1);
                    border-color: rgba(240, 193, 75, 0.5);
                    transform: translateX(5px);
                }
                .size-icon {
                    width: 50px;
                    height: 50px;
                    background: rgba(240, 193, 75, 0.2);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    color: #f0c14b;
                }
                .size-info h4 {
                    color: #fff;
                    margin: 0 0 0.25rem 0;
                    font-size: 1rem;
                }
                .size-dimensions {
                    color: #f0c14b;
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                .size-use {
                    display: block;
                    color: #888;
                    font-size: 0.75rem;
                    margin-top: 0.25rem;
                }
                .size-badge {
                    position: absolute;
                    top: -8px;
                    right: 10px;
                    background: #f0c14b;
                    color: #1a1a2e;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                .size-badge.premium {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                }
                .download-progress {
                    margin-top: 1.5rem;
                    text-align: center;
                }
                .progress-bar {
                    width: 100%;
                    height: 6px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 3px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #f0c14b, #e6a700);
                    border-radius: 3px;
                    width: 0%;
                    transition: width 0.3s ease;
                    animation: progressPulse 1.5s ease-in-out infinite;
                }
                @keyframes progressPulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .progress-text {
                    color: #aaa;
                    margin-top: 0.75rem;
                    font-size: 0.9rem;
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Close modal handler
        const closeBtn = downloadModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => {
            downloadModal.remove();
        });
        
        // Size option click handlers
        const sizeOptions = downloadModal.querySelectorAll('.size-option');
        sizeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const width = parseInt(option.dataset.width);
                const height = parseInt(option.dataset.height);
                const sizeName = option.dataset.size;
                
                // Show progress
                const progressDiv = downloadModal.querySelector('.download-progress');
                const progressFill = downloadModal.querySelector('.progress-fill');
                const progressText = downloadModal.querySelector('.progress-text');
                progressDiv.style.display = 'block';
                progressFill.style.width = '20%';
                progressText.textContent = 'Capturing invitation...';
                
                // Disable all options during download
                sizeOptions.forEach(opt => opt.style.pointerEvents = 'none');
                
                // Generate HD image
                generateHDImage(invitePreview, width, height, sizeName)
                    .then(dataUrl => {
                        progressFill.style.width = '100%';
                        progressText.textContent = 'Download starting...';
                        
                        // Download the image
                        const link = document.createElement('a');
                        const coupleName = invitePreview.querySelector('.invite-couple')?.textContent || 'Wedding';
                        link.download = `${coupleName.replace(/\s+/g, '_')}_Invitation_${sizeName}_${Date.now()}.png`;
                        link.href = dataUrl;
                        link.click();
                        
                        // Close modal after brief delay
                        setTimeout(() => {
                            downloadModal.remove();
                            showToast('✅ Invitation downloaded successfully!', 'success');
                        }, 500);
                    })
                    .catch(error => {
                        console.error('Download error:', error);
                        progressText.textContent = 'Error generating image. Please try again.';
                        progressFill.style.background = '#ff4444';
                        sizeOptions.forEach(opt => opt.style.pointerEvents = 'auto');
                    });
            });
        });
        
        // Click outside to close
        downloadModal.addEventListener('click', (e) => {
            if (e.target === downloadModal) {
                downloadModal.remove();
            }
        });
    }
    
    // Helper function to generate HD images
    function generateHDImage(element, targetWidth, targetHeight, sizeName) {
        return new Promise((resolve, reject) => {
            // First capture the element at high resolution
            html2canvas(element, {
                allowTaint: true,
                useCORS: true,
                scale: 3, // High quality capture
                backgroundColor: '#1a1a2e',
                logging: false
            }).then(sourceCanvas => {
                // Create a new canvas with the target dimensions
                const targetCanvas = document.createElement('canvas');
                targetCanvas.width = targetWidth;
                targetCanvas.height = targetHeight;
                const ctx = targetCanvas.getContext('2d');
                
                // Fill background
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(0, 0, targetWidth, targetHeight);
                
                // Calculate scaling to fit the content while maintaining aspect ratio
                const sourceRatio = sourceCanvas.width / sourceCanvas.height;
                const targetRatio = targetWidth / targetHeight;
                
                let drawWidth, drawHeight, offsetX, offsetY;
                
                if (sourceRatio > targetRatio) {
                    // Source is wider - fit to width with padding
                    drawWidth = targetWidth * 0.9;
                    drawHeight = drawWidth / sourceRatio;
                    offsetX = targetWidth * 0.05;
                    offsetY = (targetHeight - drawHeight) / 2;
                } else {
                    // Source is taller - fit to height with padding
                    drawHeight = targetHeight * 0.9;
                    drawWidth = drawHeight * sourceRatio;
                    offsetX = (targetWidth - drawWidth) / 2;
                    offsetY = targetHeight * 0.05;
                }
                
                // Draw the source image scaled to fit
                ctx.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);
                
                // Add watermark/branding
                ctx.fillStyle = 'rgba(240, 193, 75, 0.3)';
                ctx.font = '14px Arial';
                ctx.textAlign = 'right';
                ctx.fillText('Created with Wedease', targetWidth - 20, targetHeight - 15);
                
                resolve(targetCanvas.toDataURL('image/png', 1.0));
            }).catch(reject);
        });
    }
    
    // Toast notification helper
    function showToast(message, type = 'info') {
        const existingToast = document.querySelector('.invite-toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `invite-toast ${type}`;
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #1a1a2e, #16213e)'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 10001;
            animation: toastSlideUp 0.3s ease;
            border: 1px solid rgba(240, 193, 75, 0.3);
        `;
        
        // Add animation
        if (!document.getElementById('toast-animation-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-animation-styles';
            style.textContent = `
                @keyframes toastSlideUp {
                    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
    
    function shareInvite() {
        const invitePreview = document.querySelector('.invite-preview');
        if (!invitePreview) {
            alert('Please generate an invitation first');
            return;
        }
        
        // Get invitation details for share message
        const coupleNameEl = invitePreview.querySelector('.invite-couple');
        const dateEl = invitePreview.querySelector('.invite-date');
        const venueEl = invitePreview.querySelector('.invite-venue');
        
        const coupleName = coupleNameEl ? coupleNameEl.textContent : 'Our Wedding';
        const date = dateEl ? dateEl.textContent.replace(/[📅\s]/g, '').trim() : '';
        const venue = venueEl ? venueEl.textContent.replace(/[📍\s]/g, '').trim() : '';
        
        // Create enhanced share modal
        const shareModal = document.createElement('div');
        shareModal.className = 'share-modal enhanced';
        shareModal.innerHTML = `
            <div class="share-modal-content enhanced">
                <span class="close-modal">&times;</span>
                <h3><i class="fas fa-share-alt"></i> Share Your Invitation</h3>
                
                <div class="share-preview-section">
                    <div class="share-preview-image" id="share-preview-img">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Generating preview...</p>
                    </div>
                </div>
                
                <div class="share-message-section">
                    <label>Customize your message:</label>
                    <textarea id="share-message-text" rows="3" placeholder="Your message to guests...">🎊 You're Invited! 🎊

${coupleName} cordially invite you to celebrate their wedding!

📅 ${date}
📍 ${venue}

We would be honored by your presence on our special day! 💒✨</textarea>
                </div>
                
                <div class="share-options enhanced">
                    <h4>Share via:</h4>
                    <div class="share-buttons-grid">
                        <button class="share-btn-option whatsapp" data-platform="whatsapp">
                            <i class="fab fa-whatsapp"></i>
                            <span>WhatsApp</span>
                        </button>
                        <button class="share-btn-option whatsapp-status" data-platform="whatsapp-status">
                            <i class="fas fa-circle-notch"></i>
                            <span>WA Status</span>
                        </button>
                        <button class="share-btn-option facebook" data-platform="facebook">
                            <i class="fab fa-facebook-f"></i>
                            <span>Facebook</span>
                        </button>
                        <button class="share-btn-option twitter" data-platform="twitter">
                            <i class="fab fa-twitter"></i>
                            <span>Twitter</span>
                        </button>
                        <button class="share-btn-option email" data-platform="email">
                            <i class="fas fa-envelope"></i>
                            <span>Email</span>
                        </button>
                        <button class="share-btn-option copy" data-platform="copy">
                            <i class="fas fa-copy"></i>
                            <span>Copy</span>
                        </button>
                    </div>
                </div>
                
                <div class="share-tip">
                    <i class="fas fa-lightbulb"></i>
                    <span>Tip: Download the invitation first, then attach it when sharing!</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(shareModal);
        
        // Add enhanced share modal styles
        if (!document.getElementById('share-modal-styles-enhanced')) {
            const styles = document.createElement('style');
            styles.id = 'share-modal-styles-enhanced';
            styles.textContent = `
                .share-modal.enhanced {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.85);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease;
                }
                .share-modal-content.enhanced {
                    background: linear-gradient(145deg, #1a1a2e, #16213e);
                    border-radius: 20px;
                    padding: 2rem;
                    max-width: 480px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    border: 1px solid rgba(240, 193, 75, 0.3);
                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6);
                }
                .share-modal-content.enhanced h3 {
                    color: #f0c14b;
                    margin-bottom: 1.5rem;
                    font-size: 1.4rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .share-modal.enhanced .close-modal {
                    position: absolute;
                    top: 1rem;
                    right: 1.5rem;
                    font-size: 1.8rem;
                    color: #888;
                    cursor: pointer;
                    transition: all 0.3s;
                    line-height: 1;
                }
                .share-modal.enhanced .close-modal:hover {
                    color: #f0c14b;
                    transform: rotate(90deg);
                }
                .share-preview-section {
                    margin-bottom: 1.5rem;
                }
                .share-preview-image {
                    background: rgba(0, 0, 0, 0.3);
                    border-radius: 12px;
                    padding: 1rem;
                    text-align: center;
                    min-height: 120px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #888;
                }
                .share-preview-image img {
                    max-width: 100%;
                    max-height: 200px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                }
                .share-preview-image i {
                    font-size: 2rem;
                    color: #f0c14b;
                    margin-bottom: 0.5rem;
                }
                .share-message-section {
                    margin-bottom: 1.5rem;
                }
                .share-message-section label {
                    display: block;
                    color: #aaa;
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                }
                .share-message-section textarea {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                    padding: 1rem;
                    color: #fff;
                    font-size: 0.95rem;
                    resize: vertical;
                    font-family: inherit;
                    line-height: 1.5;
                }
                .share-message-section textarea:focus {
                    outline: none;
                    border-color: rgba(240, 193, 75, 0.5);
                }
                .share-options.enhanced h4 {
                    color: #888;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 1rem;
                }
                .share-buttons-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 0.75rem;
                }
                .share-btn-option {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 1rem 0.5rem;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.8rem;
                    color: white;
                }
                .share-btn-option i {
                    font-size: 1.5rem;
                }
                .share-btn-option.whatsapp {
                    background: linear-gradient(135deg, #25D366, #128C7E);
                }
                .share-btn-option.whatsapp-status {
                    background: linear-gradient(135deg, #00a884, #008069);
                }
                .share-btn-option.facebook {
                    background: linear-gradient(135deg, #1877f2, #0d5bbd);
                }
                .share-btn-option.twitter {
                    background: linear-gradient(135deg, #1da1f2, #0c85d0);
                }
                .share-btn-option.email {
                    background: linear-gradient(135deg, #ea4335, #c5221f);
                }
                .share-btn-option.copy {
                    background: linear-gradient(135deg, #6c757d, #495057);
                }
                .share-btn-option:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                }
                .share-btn-option:active {
                    transform: translateY(0);
                }
                .share-tip {
                    margin-top: 1.5rem;
                    padding: 1rem;
                    background: rgba(240, 193, 75, 0.1);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: #f0c14b;
                    font-size: 0.85rem;
                }
                .share-tip i {
                    font-size: 1.2rem;
                }
                @media (max-width: 400px) {
                    .share-buttons-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Generate preview image
        const previewImgContainer = shareModal.querySelector('#share-preview-img');
        html2canvas(invitePreview, {
            allowTaint: true,
            useCORS: true,
            scale: 2,
            backgroundColor: '#1a1a2e'
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            previewImgContainer.innerHTML = `<img src="${imgData}" alt="Your Invitation">`;
            
            // Store for sharing
            shareModal.dataset.imageData = imgData;
        }).catch(err => {
            previewImgContainer.innerHTML = `<i class="fas fa-exclamation-circle"></i><p>Preview unavailable</p>`;
        });
        
        // Close modal handlers
        const closeBtn = shareModal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => shareModal.remove());
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) shareModal.remove();
        });
        
        // Share button handlers
        const shareButtons = shareModal.querySelectorAll('.share-btn-option');
        shareButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                const message = shareModal.querySelector('#share-message-text').value;
                const imageData = shareModal.dataset.imageData;
                
                handleShare(platform, message, coupleName, imageData, btn);
            });
        });
    }
    
    // Handle different share platforms
    function handleShare(platform, message, coupleName, imageData, button) {
        const originalContent = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;
        
        const encodedMessage = encodeURIComponent(message);
        
        switch(platform) {
            case 'whatsapp':
                // Direct WhatsApp share - opens WhatsApp with pre-filled message
                window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
                showToast('💬 Opening WhatsApp... Attach your downloaded invitation!', 'success');
                break;
                
            case 'whatsapp-status':
                // For WhatsApp Status, user needs to download first
                if (imageData) {
                    // Auto-download the image for status
                    const link = document.createElement('a');
                    link.download = `${coupleName.replace(/\s+/g, '_')}_Invitation_Status.png`;
                    link.href = imageData;
                    link.click();
                    showToast('📱 Image downloaded! Now share it to your WhatsApp Status', 'success');
                } else {
                    showToast('⚠️ Please wait for preview to load', 'info');
                }
                break;
                
            case 'facebook':
                window.open(`https://www.facebook.com/sharer/sharer.php?quote=${encodedMessage}`, '_blank');
                showToast('📘 Opening Facebook...', 'success');
                break;
                
            case 'twitter':
                const tweetText = message.substring(0, 280); // Twitter limit
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`, '_blank');
                showToast('🐦 Opening Twitter...', 'success');
                break;
                
            case 'email':
                const subject = `Wedding Invitation: ${coupleName}`;
                window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodedMessage}`, '_blank');
                showToast('📧 Opening email client...', 'success');
                break;
                
            case 'copy':
                navigator.clipboard.writeText(message).then(() => {
                    button.innerHTML = '<i class="fas fa-check"></i><span>Copied!</span>';
                    button.style.background = 'linear-gradient(135deg, #28a745, #20c997)';
                    showToast('✅ Message copied to clipboard!', 'success');
                    
                    setTimeout(() => {
                        button.innerHTML = originalContent;
                        button.style.background = '';
                        button.disabled = false;
                    }, 2000);
                    return;
                }).catch(err => {
                    // Fallback for older browsers
                    const textarea = document.createElement('textarea');
                    textarea.value = message;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    showToast('✅ Message copied!', 'success');
                });
                break;
        }
        
        // Reset button after delay
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.disabled = false;
        }, 1500);
    }
});
