
export const playNotificationSound = () => {
  try {
    const audio = new Audio(`${import.meta.env.BASE_URL}alerta.mp3`);
    audio.play().catch(error => {
      // Browsers often block sounds if the user hasn't interacted with the page yet
      if (error.name === 'NotAllowedError') {
        console.warn("Audio playback was blocked. Please interact with the page to enable sounds.");
      } else {
        console.error("Error playing notification sound:", error);
      }
    });
  } catch (err) {
    console.error("Failed to initialize audio:", err);
  }
};
