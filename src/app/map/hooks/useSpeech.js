import { useState, useRef, useEffect, useCallback } from 'react';

export function useSpeech(language, voiceType, audioEnabled) {
  const speechSynth = useRef(null);
  const lastSpokenTime = useRef(null);
  const isSpeaking = useRef(false);
  const speechQueue = useRef([]);
  const [speechBlocked, setSpeechBlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynth.current = window.speechSynthesis;
      
      const checkSpeech = () => {
        const silent = new SpeechSynthesisUtterance('');
        silent.onend = () => setSpeechBlocked(false);
        silent.onerror = () => setSpeechBlocked(true);
        try {
          speechSynth.current.speak(silent);
        } catch (e) {
          setSpeechBlocked(true);
        }
      };
      checkSpeech();
    }
  }, []);

  const processSpeechQueue = useCallback(() => {
    if (isSpeaking.current || speechQueue.current.length === 0) return;
    const nextUtterance = speechQueue.current.shift();
    isSpeaking.current = true;
    if (speechSynth.current) speechSynth.current.speak(nextUtterance);
  }, []);

  const [alertsData, setAlertsData] = useState({});

  useEffect(() => {
    fetch('/locales/audioAlerts.json')
      .then(res => res.json())
      .then(setAlertsData)
      .catch(err => console.error('Failed to load audio alerts:', err));
  }, []);

  const getMessage = useCallback((key, variables = {}) => {
    const langKey = language === 'hindi' ? 'hi' : 'en';
    let template = alertsData[langKey]?.[key] || alertsData['en']?.[key];
    if (!template) return '';
    return Object.entries(variables).reduce((msg, [k, v]) => {
      return msg.replace(new RegExp(`{${k}}`, 'g'), v);
    }, template);
  }, [alertsData, language]);

  const speakMultiple = useCallback((camerasInRange, userSpeed) => {
    if (!audioEnabled || !speechSynth.current || camerasInRange.length === 0 || !alertsData.en) return;

    const now = Date.now();
    if (lastSpokenTime.current && (now - lastSpokenTime.current) < 5000) return;
    lastSpokenTime.current = now;

    let message = '';
    
    if (camerasInRange.length === 1) {
      const cam = camerasInRange[0];
      if (cam.type === 'red' || cam.type === 'redlight') {
        message = getMessage('red_light_single', { distance: Math.round(cam.distance) });
      } else {
        message = getMessage('speed_camera_single', {
          distance: Math.round(cam.distance),
          speed: Math.round(userSpeed),
          limit: cam.speedLimit
        });
      }
      if (cam.isSuspicious) {
        message = getMessage('camera_suspicious_prefix') + message;
      }
    } else {
      message = getMessage('speed_camera_multiple', { count: camerasInRange.length });
      camerasInRange.forEach((cam, index) => {
        if (cam.type === 'red' || cam.type === 'redlight') {
          message += getMessage('red_light_item', { 
            index: index + 1, 
            distance: Math.round(cam.distance) 
          });
        } else {
          message += getMessage('speed_camera_item', { 
            index: index + 1, 
            distance: Math.round(cam.distance), 
            limit: cam.speedLimit 
          });
        }
        if (cam.isSuspicious) message += ' (reported fake) ';
      });
    }

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = language === 'hindi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = voiceType === 'male' ? 0.8 : 1.2;

    utterance.onstart = () => { isSpeaking.current = true; };
    utterance.onend = () => {
      isSpeaking.current = false;
      processSpeechQueue();
    };
    utterance.onerror = () => {
      isSpeaking.current = false;
      processSpeechQueue();
    };

    if (isSpeaking.current) {
      speechSynth.current.cancel();
      speechQueue.current = [utterance];
    } else {
      speechQueue.current.push(utterance);
      processSpeechQueue();
    }
  }, [audioEnabled, language, voiceType, processSpeechQueue, alertsData, getMessage]);

  const enableAudioManually = useCallback(() => {
    if (speechSynth.current) {
      const pingTitle = language === 'hindi' ? '\u0911\u0921\u093f\u092F\u094B \u0938\u0915\u094D\u0930\u093F\u092F' : 'Audio active';
      const ping = new SpeechSynthesisUtterance(pingTitle);
      ping.lang = language === 'hindi' ? 'hi-IN' : 'en-US';
      speechSynth.current.speak(ping);
      setSpeechBlocked(false);
      return true;
    }
    return false;
  }, [language]);

  return { speechBlocked, speakMultiple, enableAudioManually, getMessage };
}
