import html2canvas from 'html2canvas';
import { Trip } from '@/types';
import { calculateDistance, formatDistance } from './geo';

export async function generateTripImage(trip: Trip): Promise<Blob> {
  // Create a hidden container for the image
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 600px;
    padding: 32px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-radius: 16px;
  `;
  
  // Calculate stats
  let totalDistance = 0;
  for (let i = 0; i < trip.cities.length - 1; i++) {
    totalDistance += calculateDistance(
      trip.cities[i].lat, trip.cities[i].lng,
      trip.cities[i + 1].lat, trip.cities[i + 1].lng
    );
  }
  const firstDate = trip.cities[0]?.arriveDate;
  const lastCity = trip.cities[trip.cities.length - 1];
  const lastDate = lastCity?.departDate || lastCity?.arriveDate;
  const days = firstDate && lastDate 
    ? Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Build HTML content
  container.innerHTML = `
    <div style="color: white;">
      <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">${trip.name}</h1>
      <p style="margin: 0 0 24px 0; font-size: 14px; opacity: 0.9;">
        ${trip.cities.length} destination${trip.cities.length !== 1 ? 's' : ''} 
        ${totalDistance > 0 ? ` • ${formatDistance(totalDistance)}` : ''}
        ${days ? ` • ${days} day${days !== 1 ? 's' : ''}` : ''}
      </p>
      
      <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 20px;">
        ${trip.cities.map((city, i) => `
          <div style="display: flex; align-items: flex-start; margin-bottom: ${i < trip.cities.length - 1 ? '16px' : '0'};">
            <div style="
              width: 24px; 
              height: 24px; 
              border-radius: 50%; 
              background: white; 
              color: #667eea; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: 600; 
              font-size: 12px;
              margin-right: 12px;
              flex-shrink: 0;
            ">${i + 1}</div>
            <div style="flex: 1;">
              <p style="margin: 0 0 2px 0; font-size: 16px; font-weight: 600;">${city.name}</p>
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">${city.country}</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.7;">
                ${formatDate(city.arriveDate)}${city.departDate ? ` - ${formatDate(city.departDate)}` : ''}
              </p>
            </div>
          </div>
        `).join('')}
      </div>
      
      <p style="margin: 20px 0 0 0; font-size: 11px; opacity: 0.6; text-align: center;">
        Created with TripLink
      </p>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 2,
      logging: false,
    });

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate image'));
        }
      }, 'image/png');
    });
  } finally {
    document.body.removeChild(container);
  }
}

export async function downloadTripImage(trip: Trip) {
  try {
    const blob = await generateTripImage(trip);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${trip.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_trip.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download trip image:', error);
    throw error;
  }
}

export async function shareTripImage(trip: Trip) {
  try {
    const blob = await generateTripImage(trip);
    
    // Check if Web Share API is available
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], `${trip.name}.png`, { type: 'image/png' });
      const shareData = {
        title: trip.name,
        text: `Check out my trip: ${trip.name}`,
        files: [file],
      };
      
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
    }
    
    // Fallback to download
    await downloadTripImage(trip);
    return false;
  } catch (error) {
    // User cancelled or share failed, fallback to download
    await downloadTripImage(trip);
    return false;
  }
}
