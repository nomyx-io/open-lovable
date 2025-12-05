'use client';

import { useState, useCallback } from 'react';
import type { ScrapeData, ConversationContext, ChatMessageMetadata } from '../types';

interface UseWebScrapingReturn {
  urlScreenshot: string | null;
  setUrlScreenshot: React.Dispatch<React.SetStateAction<string | null>>;
  isScreenshotLoaded: boolean;
  setIsScreenshotLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  isCapturingScreenshot: boolean;
  screenshotError: string | null;
  setScreenshotError: React.Dispatch<React.SetStateAction<string | null>>;
  isPreparingDesign: boolean;
  setIsPreparingDesign: React.Dispatch<React.SetStateAction<boolean>>;
  targetUrl: string;
  setTargetUrl: React.Dispatch<React.SetStateAction<string>>;
  captureUrlScreenshot: (url: string) => Promise<void>;
  scrapeWebsite: (url: string) => Promise<ScrapeData>;
  extractBrandStyles: (url: string, prompt: string) => Promise<any>;
}

export function useWebScraping(
  addChatMessage: (content: string, type: 'user' | 'ai' | 'system' | 'file-update' | 'command' | 'error', metadata?: ChatMessageMetadata) => void,
  setConversationContext: React.Dispatch<React.SetStateAction<ConversationContext>>,
  setActiveTab: React.Dispatch<React.SetStateAction<'generation' | 'preview'>>
): UseWebScrapingReturn {
  const [urlScreenshot, setUrlScreenshot] = useState<string | null>(null);
  const [isScreenshotLoaded, setIsScreenshotLoaded] = useState(false);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [isPreparingDesign, setIsPreparingDesign] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string>('');

  const captureUrlScreenshot = useCallback(async (url: string) => {
    setIsCapturingScreenshot(true);
    setScreenshotError(null);
    
    try {
      const response = await fetch('/api/scrape-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      const data = await response.json();
      if (data.success && data.screenshot) {
        setIsScreenshotLoaded(false);
        setUrlScreenshot(data.screenshot);
        setIsPreparingDesign(true);
        
        // Store clean URL for display
        const cleanUrl = url.replace(/^https?:\/\//i, '');
        setTargetUrl(cleanUrl);
        
        // Switch to preview tab to show the screenshot
        setActiveTab('preview');
      } else {
        setScreenshotError(data.error || 'Failed to capture screenshot');
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      setScreenshotError('Network error while capturing screenshot');
    } finally {
      setIsCapturingScreenshot(false);
    }
  }, [setActiveTab]);

  const scrapeWebsite = useCallback(async (url: string): Promise<ScrapeData> => {
    // Check for pre-scraped content from search results
    const storedMarkdown = sessionStorage.getItem('siteMarkdown');
    if (storedMarkdown) {
      sessionStorage.removeItem('siteMarkdown');
      addChatMessage('Using cached content from search results...', 'system');
      return {
        success: true,
        content: storedMarkdown,
        title: new URL(url).hostname,
        source: 'search-result'
      };
    }
    
    // Perform fresh scraping
    const response = await fetch('/api/scrape-url-enhanced', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      throw new Error('Failed to scrape website');
    }
    
    const scrapeData = await response.json() as ScrapeData;
    
    if (!scrapeData.success) {
      throw new Error(scrapeData.error || 'Failed to scrape website');
    }
    
    // Store in conversation context
    setConversationContext(prev => ({
      ...prev,
      scrapedWebsites: [...prev.scrapedWebsites, {
        url,
        content: scrapeData,
        timestamp: new Date()
      }],
      currentProject: `${url} Clone`
    }));
    
    return scrapeData;
  }, [addChatMessage, setConversationContext]);

  const extractBrandStyles = useCallback(async (url: string, prompt: string): Promise<any> => {
    addChatMessage('Extracting brand styles from the website...', 'system');
    
    const response = await fetch('/api/extract-brand-styles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, prompt })
    });
    
    if (!response.ok) {
      throw new Error('Failed to extract brand styles');
    }
    
    const brandGuidelines = await response.json();
    
    if (!brandGuidelines.success) {
      throw new Error(brandGuidelines.error || 'Failed to extract brand styles');
    }
    
    // Clean URL for display
    const cleanUrl = url.replace(/^https?:\/\//i, '');
    
    addChatMessage(`Acquired branding format from ${cleanUrl}`, 'system', {
      brandingData: brandGuidelines.guidelines,
      sourceUrl: cleanUrl
    });
    addChatMessage(`Building your custom component using these brand guidelines...`, 'system');
    
    // Store in conversation context
    setConversationContext(prev => ({
      ...prev,
      scrapedWebsites: [...prev.scrapedWebsites, {
        url,
        content: { brandGuidelines },
        timestamp: new Date()
      }],
      currentProject: `Custom build using ${url} brand`
    }));
    
    return brandGuidelines;
  }, [addChatMessage, setConversationContext]);

  return {
    urlScreenshot,
    setUrlScreenshot,
    isScreenshotLoaded,
    setIsScreenshotLoaded,
    isCapturingScreenshot,
    screenshotError,
    setScreenshotError,
    isPreparingDesign,
    setIsPreparingDesign,
    targetUrl,
    setTargetUrl,
    captureUrlScreenshot,
    scrapeWebsite,
    extractBrandStyles
  };
}