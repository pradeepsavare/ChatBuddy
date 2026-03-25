import { useEffect, useRef, useState } from 'react'
import { Avatar, Button, ConfigProvider, Input, Modal, Select, Typography, theme as antdTheme } from 'antd'
import {
  ClockCircleOutlined,
  DeleteOutlined,
  MoonOutlined,
  RobotOutlined,
  SendOutlined,
  SettingOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons'

const { Paragraph, Text } = Typography

const storageKey = 'chatbuddy-conversation-v2'
const historyStorageKey = 'chatbuddy-conversation-history-v1'
const themeStorageKey = 'chatbuddy-theme-v1'
const providerStorageKey = 'chatbuddy-provider-v1'
const ollamaUrlStorageKey = 'chatbuddy-ollama-url-v1'
const ollamaModelStorageKey = 'chatbuddy-ollama-model-v1'
const openaiApiKeyStorageKey = 'chatbuddy-openai-key-v1'
const openaiModelStorageKey = 'chatbuddy-openai-model-v1'
const geminiApiKeyStorageKey = 'chatbuddy-gemini-key-v1'
const geminiModelStorageKey = 'chatbuddy-gemini-model-v1'
const customApiKeyStorageKey = 'chatbuddy-custom-api-key-v1'
const customModelStorageKey = 'chatbuddy-custom-model-v1'
const defaultProvider = 'ollama'
const defaultOllamaUrl = 'http://localhost:11434'
const defaultOllamaModel = 'llama3.2:3b'
const defaultOpenAIModel = 'gpt-4.1-mini'
const defaultOpenAIBaseUrl = 'https://api.openai.com/v1'
const defaultGeminiModel = 'gemini-1.5-flash'
const defaultCustomBaseUrl = 'https://openrouter.ai/api/v1'
const defaultCustomModel = 'openai/gpt-4o-mini'

const starterMessages = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    content: 'Hi, I am ChatBuddy. I can run with your local Ollama model for free. Open Settings to confirm URL and model, then start chatting.',
    createdAt: '09:00',
  },
]

const providerOptions = [
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'openai', label: 'OpenAI (ChatGPT API)' },
  { value: 'gemini', label: 'Google Gemini API' },
  { value: 'custom', label: 'Other API (OpenAI compatible)' },
  { value: 'copilot', label: 'GitHub Copilot (not public API)' },
]

function getStoredConversation() {
  if (typeof window === 'undefined') {
    return starterMessages
  }

  try {
    const stored = window.localStorage.getItem(storageKey)

    if (!stored) {
      return starterMessages
    }

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : starterMessages
  } catch {
    return starterMessages
  }
}

function getStoredValue(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    return window.localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}

function getStoredTheme() {
  const saved = getStoredValue(themeStorageKey, 'dark')
  return saved === 'light' ? 'light' : 'dark'
}

function getProviderLabel(provider) {
  const found = providerOptions.find((option) => option.value === provider)
  return found ? found.label : provider
}

function getGeminiFriendlyError(status, payload, fallbackText) {
  if (status === 429) {
    const retryInfo = Array.isArray(payload?.error?.details)
      ? payload.error.details.find((entry) => entry?.['@type'] === 'type.googleapis.com/google.rpc.RetryInfo')
      : null
    const retryDelay = retryInfo?.retryDelay || 'a few seconds'

    return `Gemini quota exceeded (429). Retry after ${retryDelay}. If this persists, check Gemini usage limits/billing, switch to another Gemini model, or change provider (Ollama/OpenAI).`
  }

  if (status === 403) {
    return 'Gemini access denied (403). Verify the API key, project permissions, and API enablement.'
  }

  if (status === 400) {
    return payload?.error?.message || 'Gemini request is invalid (400). Check model name and request format.'
  }

  return payload?.error?.message || fallbackText
}

function getStoredOllamaUrl() {
  return getStoredValue(ollamaUrlStorageKey, defaultOllamaUrl)
}

function getStoredOllamaModel() {
  return getStoredValue(ollamaModelStorageKey, defaultOllamaModel)
}

function getStoredProvider() {
  const provider = getStoredValue(providerStorageKey, defaultProvider)
  return providerOptions.some((option) => option.value === provider) ? provider : defaultProvider
}

function getStoredOpenAIKey() {
  return getStoredValue(openaiApiKeyStorageKey, '')
}

function getStoredOpenAIModel() {
  return getStoredValue(openaiModelStorageKey, defaultOpenAIModel)
}

function getStoredGeminiKey() {
  return getStoredValue(geminiApiKeyStorageKey, '')
}

function getStoredGeminiModel() {
  return getStoredValue(geminiModelStorageKey, defaultGeminiModel)
}

function getStoredCustomApiKey() {
  return getStoredValue(customApiKeyStorageKey, '')
}

function getStoredCustomModel() {
  return getStoredValue(customModelStorageKey, defaultCustomModel)
}

function getStoredHistory() {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(historyStorageKey)

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function formatTime(date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function App() {
  const [messages, setMessages] = useState(() => getStoredConversation())
  const [history, setHistory] = useState(() => getStoredHistory())
  const [draft, setDraft] = useState('')
  const [themeMode, setThemeMode] = useState(() => getStoredTheme())
  const [provider, setProvider] = useState(() => getStoredProvider())
  const [providerDraft, setProviderDraft] = useState(() => getStoredProvider())
  const [ollamaUrl, setOllamaUrl] = useState(() => getStoredOllamaUrl())
  const [ollamaUrlDraft, setOllamaUrlDraft] = useState(() => getStoredOllamaUrl())
  const [ollamaModel, setOllamaModel] = useState(() => getStoredOllamaModel())
  const [ollamaModelDraft, setOllamaModelDraft] = useState(() => getStoredOllamaModel())
  const [openaiApiKey, setOpenaiApiKey] = useState(() => getStoredOpenAIKey())
  const [openaiApiKeyDraft, setOpenaiApiKeyDraft] = useState(() => getStoredOpenAIKey())
  const [openaiModel, setOpenaiModel] = useState(() => getStoredOpenAIModel())
  const [openaiModelDraft, setOpenaiModelDraft] = useState(() => getStoredOpenAIModel())
  const [openaiModels, setOpenaiModels] = useState([])
  const [isLoadingOpenAIModels, setIsLoadingOpenAIModels] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState(() => getStoredGeminiKey())
  const [geminiApiKeyDraft, setGeminiApiKeyDraft] = useState(() => getStoredGeminiKey())
  const [geminiModel, setGeminiModel] = useState(() => getStoredGeminiModel())
  const [geminiModelDraft, setGeminiModelDraft] = useState(() => getStoredGeminiModel())
  const [geminiModels, setGeminiModels] = useState([])
  const [isLoadingGeminiModels, setIsLoadingGeminiModels] = useState(false)
  const [customApiKey, setCustomApiKey] = useState(() => getStoredCustomApiKey())
  const [customApiKeyDraft, setCustomApiKeyDraft] = useState(() => getStoredCustomApiKey())
  const [customModel, setCustomModel] = useState(() => getStoredCustomModel())
  const [customModelDraft, setCustomModelDraft] = useState(() => getStoredCustomModel())
  const [customModels, setCustomModels] = useState([])
  const [isLoadingCustomModels, setIsLoadingCustomModels] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState({ type: '', message: '' })
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const chatBodyRef = useRef(null)
  const responseDelayRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    window.localStorage.setItem(historyStorageKey, JSON.stringify(history))
  }, [history])

  useEffect(() => {
    window.localStorage.setItem(themeStorageKey, themeMode)
  }, [themeMode])

  useEffect(() => {
    chatBodyRef.current?.scrollTo({
      top: chatBodyRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, isTyping])

  useEffect(() => {
    return () => {
      if (responseDelayRef.current) {
        window.clearTimeout(responseDelayRef.current)
      }

      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  }, [])

  const appendAssistantMessage = (content) => {
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content,
        createdAt: formatTime(new Date()),
      },
    ])
  }

  const stopPendingResponse = () => {
    if (responseDelayRef.current) {
      window.clearTimeout(responseDelayRef.current)
      responseDelayRef.current = null
    }

    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }

    setIsTyping(false)
  }

  const archiveConversation = (conversation) => {
    const hasUserPrompt = conversation.some((message) => message.role === 'user')

    if (!hasUserPrompt) {
      return
    }

    const firstUserMessage = conversation.find((message) => message.role === 'user')
    const lastMessage = [...conversation].reverse().find((message) => message.content?.trim())
    const title = firstUserMessage?.content?.slice(0, 48) || 'Chat session'

    const entry = {
      id: `history-${Date.now()}`,
      title,
      preview: lastMessage?.content?.slice(0, 88) || 'No preview available',
      updatedAt: new Date().toISOString(),
      messages: conversation,
    }

    setHistory((currentHistory) => [entry, ...currentHistory].slice(0, 40))
  }

  const clearChat = () => {
    stopPendingResponse()
    archiveConversation(messages)
    setMessages(starterMessages)
    setDraft('')
  }

  const loadHistoryConversation = (entry) => {
    stopPendingResponse()
    setMessages(entry.messages)
    setDraft('')
    setIsHistoryModalOpen(false)
  }

  const deleteHistoryConversation = (entryId) => {
    setHistory((currentHistory) => currentHistory.filter((entry) => entry.id !== entryId))
  }

  const clearAllHistory = () => {
    setHistory([])
  }

  const saveProviderSettings = () => {
    const nextProvider = providerDraft
    const nextUrl = ollamaUrlDraft.trim() || defaultOllamaUrl
    const nextModel = ollamaModelDraft.trim() || defaultOllamaModel
    const nextOpenAIKey = openaiApiKeyDraft.trim()
    const nextOpenAIModel = openaiModelDraft.trim() || defaultOpenAIModel
    const nextGeminiKey = geminiApiKeyDraft.trim()
    const nextGeminiModel = geminiModelDraft.trim() || defaultGeminiModel
    const nextCustomKey = customApiKeyDraft.trim()
    const nextCustomModel = customModelDraft.trim() || defaultCustomModel

    setProvider(nextProvider)
    setOllamaUrl(nextUrl)
    setOllamaModel(nextModel)
    setOpenaiApiKey(nextOpenAIKey)
    setOpenaiModel(nextOpenAIModel)
    setGeminiApiKey(nextGeminiKey)
    setGeminiModel(nextGeminiModel)
    setCustomApiKey(nextCustomKey)
    setCustomModel(nextCustomModel)

    window.localStorage.setItem(providerStorageKey, nextProvider)
    window.localStorage.setItem(ollamaUrlStorageKey, nextUrl)
    window.localStorage.setItem(ollamaModelStorageKey, nextModel)
    window.localStorage.setItem(openaiApiKeyStorageKey, nextOpenAIKey)
    window.localStorage.setItem(openaiModelStorageKey, nextOpenAIModel)
    window.localStorage.setItem(geminiApiKeyStorageKey, nextGeminiKey)
    window.localStorage.setItem(geminiModelStorageKey, nextGeminiModel)
    window.localStorage.setItem(customApiKeyStorageKey, nextCustomKey)
    window.localStorage.setItem(customModelStorageKey, nextCustomModel)

    setConnectionStatus({ type: '', message: '' })
    setIsSettingsModalOpen(false)
  }

  const testProviderConnection = async () => {
    const testUrl = (ollamaUrlDraft.trim() || defaultOllamaUrl).replace(/\/$/, '')
    const testModel = ollamaModelDraft.trim() || defaultOllamaModel
    const testProvider = providerDraft
    const testOpenAIKey = openaiApiKeyDraft.trim()
    const testOpenAIModel = openaiModelDraft.trim() || defaultOpenAIModel
    const testOpenAIBaseUrl = defaultOpenAIBaseUrl.replace(/\/$/, '')
    const testGeminiKey = geminiApiKeyDraft.trim()
    const testGeminiModel = geminiModelDraft.trim() || defaultGeminiModel
    const testCustomKey = customApiKeyDraft.trim()
    const testCustomModel = customModelDraft.trim() || defaultCustomModel
    const testCustomBaseUrl = defaultCustomBaseUrl.replace(/\/$/, '')

    setIsTestingConnection(true)
    setConnectionStatus({ type: '', message: '' })

    try {
      if (testProvider === 'copilot') {
        setConnectionStatus({
          type: 'warning',
          message: 'GitHub Copilot does not expose a public chat API key endpoint for this custom app.',
        })
        return
      }

      if (testProvider === 'ollama') {
        const response = await fetch(`${testUrl}/api/tags`)

        if (!response.ok) {
          throw new Error(`Server responded with status ${response.status}`)
        }

        const data = await response.json()
        const models = Array.isArray(data?.models) ? data.models : []
        const hasModel = models.some((entry) => entry?.name === testModel)

        if (hasModel) {
          setConnectionStatus({
            type: 'success',
            message: `Connected. Model "${testModel}" is available.`,
          })
        } else {
          setConnectionStatus({
            type: 'warning',
            message: `Connected to Ollama, but model "${testModel}" is not downloaded yet. Run: ollama pull ${testModel}`,
          })
        }

        return
      }

      if (testProvider === 'openai') {
        if (!testOpenAIKey) {
          throw new Error('OpenAI API key is required.')
        }

        const response = await fetch(`${testOpenAIBaseUrl}/models`, {
          headers: {
            Authorization: `Bearer ${testOpenAIKey}`,
          },
        })

        if (!response.ok) {
          throw new Error(`OpenAI responded with status ${response.status}`)
        }

        const data = await response.json()
        const models = Array.isArray(data?.data) ? data.data : []
        const hasModel = models.some((entry) => entry?.id === testOpenAIModel)

        setConnectionStatus({
          type: hasModel ? 'success' : 'warning',
          message: hasModel
            ? `Connected. OpenAI model "${testOpenAIModel}" is available.`
            : `Connected to OpenAI, but model "${testOpenAIModel}" was not listed for this key.`,
        })

        return
      }

      if (testProvider === 'custom') {
        if (!testCustomKey) {
          throw new Error('Custom provider API key is required.')
        }

        const response = await fetch(`${testCustomBaseUrl}/models`, {
          headers: {
            Authorization: `Bearer ${testCustomKey}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Custom provider responded with status ${response.status}`)
        }

        const data = await response.json()
        const models = Array.isArray(data?.data) ? data.data : []
        const hasModel = models.some((entry) => entry?.id === testCustomModel)

        setConnectionStatus({
          type: hasModel ? 'success' : 'warning',
          message: hasModel
            ? `Connected. Custom model "${testCustomModel}" is available.`
            : `Connected to custom provider, but model "${testCustomModel}" was not listed for this key.`,
        })

        return
      }

      if (!testGeminiKey) {
        throw new Error('Gemini API key is required.')
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(testGeminiKey)}`)

      if (!response.ok) {
        throw new Error(`Gemini responded with status ${response.status}`)
      }

      const data = await response.json()
      const models = Array.isArray(data?.models) ? data.models : []
      const hasModel = models.some((entry) => entry?.name?.endsWith(`/${testGeminiModel}`))

      setConnectionStatus({
        type: hasModel ? 'success' : 'warning',
        message: hasModel
          ? `Connected. Gemini model "${testGeminiModel}" is available.`
          : `Connected to Gemini, but model "${testGeminiModel}" was not found in the returned list.`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown connection error.'
      setConnectionStatus({
        type: 'error',
        message: `Connection failed: ${message}`,
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const loadGeminiModels = async () => {
    const testGeminiKey = geminiApiKeyDraft.trim()

    if (!testGeminiKey) {
      setConnectionStatus({
        type: 'error',
        message: 'Gemini API key is required before loading models.',
      })
      return
    }

    setIsLoadingGeminiModels(true)
    setConnectionStatus({ type: '', message: '' })

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(testGeminiKey)}`,
      )

      if (!response.ok) {
        throw new Error(`Gemini responded with status ${response.status}`)
      }

      const data = await response.json()
      const models = Array.isArray(data?.models) ? data.models : []
      const normalized = models
        .map((entry) => entry?.name || '')
        .filter((name) => name.startsWith('models/'))
        .map((name) => name.replace(/^models\//, ''))
        .filter((name) => name.toLowerCase().includes('gemini'))
        .sort((a, b) => a.localeCompare(b))

      setGeminiModels(normalized)

      if (normalized.length > 0) {
        setConnectionStatus({
          type: 'success',
          message: `Loaded ${normalized.length} Gemini model(s).`,
        })

        if (!normalized.includes(geminiModelDraft)) {
          setGeminiModelDraft(normalized[0])
        }
      } else {
        setConnectionStatus({
          type: 'warning',
          message: 'No Gemini models were returned for this key.',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request error.'
      setConnectionStatus({
        type: 'error',
        message: `Could not load Gemini models: ${message}`,
      })
    } finally {
      setIsLoadingGeminiModels(false)
    }
  }

  const loadOpenAIModels = async () => {
    const testOpenAIKey = openaiApiKeyDraft.trim()
    const testOpenAIBaseUrl = defaultOpenAIBaseUrl.replace(/\/$/, '')

    if (!testOpenAIKey) {
      setConnectionStatus({
        type: 'error',
        message: 'OpenAI API key is required before loading models.',
      })
      return
    }

    setIsLoadingOpenAIModels(true)
    setConnectionStatus({ type: '', message: '' })

    try {
      const response = await fetch(`${testOpenAIBaseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${testOpenAIKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`OpenAI responded with status ${response.status}`)
      }

      const data = await response.json()
      const models = Array.isArray(data?.data) ? data.data : []
      const normalized = models
        .map((entry) => entry?.id || '')
        .filter(Boolean)
        .filter((id) => /gpt|o1|o3|o4/i.test(id))
        .sort((a, b) => a.localeCompare(b))

      setOpenaiModels(normalized)

      if (normalized.length > 0) {
        setConnectionStatus({
          type: 'success',
          message: `Loaded ${normalized.length} OpenAI model(s).`,
        })

        if (!normalized.includes(openaiModelDraft)) {
          setOpenaiModelDraft(normalized[0])
        }
      } else {
        setConnectionStatus({
          type: 'warning',
          message: 'No OpenAI models were returned for this key.',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request error.'
      setConnectionStatus({
        type: 'error',
        message: `Could not load OpenAI models: ${message}`,
      })
    } finally {
      setIsLoadingOpenAIModels(false)
    }
  }

  const loadCustomModels = async () => {
    const testCustomKey = customApiKeyDraft.trim()
    const testCustomBaseUrl = defaultCustomBaseUrl.replace(/\/$/, '')

    if (!testCustomKey) {
      setConnectionStatus({
        type: 'error',
        message: 'Custom API key is required before loading models.',
      })
      return
    }

    setIsLoadingCustomModels(true)
    setConnectionStatus({ type: '', message: '' })

    try {
      const response = await fetch(`${testCustomBaseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${testCustomKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Custom provider responded with status ${response.status}`)
      }

      const data = await response.json()
      const models = Array.isArray(data?.data) ? data.data : []
      const normalized = models
        .map((entry) => entry?.id || '')
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b))

      setCustomModels(normalized)

      if (normalized.length > 0) {
        setConnectionStatus({
          type: 'success',
          message: `Loaded ${normalized.length} custom model(s).`,
        })

        if (!normalized.includes(customModelDraft)) {
          setCustomModelDraft(normalized[0])
        }
      } else {
        setConnectionStatus({
          type: 'warning',
          message: 'No models were returned by the custom provider.',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request error.'
      setConnectionStatus({
        type: 'error',
        message: `Could not load custom models: ${message}`,
      })
    } finally {
      setIsLoadingCustomModels(false)
    }
  }

  const streamAssistantReplyFromOllama = async (history) => {
    const replyId = `assistant-${Date.now()}`
    const createdAt = formatTime(new Date())
    let combinedText = ''

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: replyId, role: 'assistant', content: '', createdAt },
    ])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: ollamaModel,
          stream: true,
          messages: history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response stream available from API.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.trim()) {
            continue
          }

          let parsed

          try {
            parsed = JSON.parse(line)
          } catch {
            continue
          }

          const delta = parsed?.message?.content

          if (delta) {
            combinedText += delta
            setMessages((currentMessages) =>
              currentMessages.map((message) =>
                message.id === replyId
                  ? {
                      ...message,
                      content: combinedText,
                    }
                  : message,
              ),
            )
          }
        }
      }

      if (!combinedText.trim()) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === replyId
              ? {
                  ...message,
                  content: 'No text was returned for this request. Please try again.',
                }
              : message,
          ),
        )
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown request error.'

      const hint =
        ' Make sure Ollama is running, the model exists, and the URL is reachable (default: http://localhost:11434).'

      setMessages((currentMessages) =>
        currentMessages.map((entry) =>
          entry.id === replyId
            ? {
                ...entry,
                content: `Request failed: ${message}${hint}`,
              }
            : entry,
        ),
      )
    } finally {
      abortRef.current = null
      setIsTyping(false)
    }
  }

  const streamAssistantReplyFromOpenAI = async (history) => {
    if (!openaiApiKey) {
      appendAssistantMessage('OpenAI API key is missing. Open Settings and add your key.')
      setIsTyping(false)
      return
    }

    const replyId = `assistant-${Date.now()}`
    const createdAt = formatTime(new Date())
    let combinedText = ''

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: replyId, role: 'assistant', content: '', createdAt },
    ])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(`${defaultOpenAIBaseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          stream: true,
          messages: history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response stream available from API.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const eventBlock of events) {
          const dataLines = eventBlock
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())

          for (const data of dataLines) {
            if (!data || data === '[DONE]') {
              continue
            }

            let parsed

            try {
              parsed = JSON.parse(data)
            } catch {
              continue
            }

            const delta = parsed?.choices?.[0]?.delta?.content

            if (delta) {
              combinedText += delta
              setMessages((currentMessages) =>
                currentMessages.map((message) =>
                  message.id === replyId
                    ? {
                        ...message,
                        content: combinedText,
                      }
                    : message,
                ),
              )
            }
          }
        }
      }

      if (!combinedText.trim()) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === replyId
              ? {
                  ...message,
                  content: 'No text was returned for this request. Please try again.',
                }
              : message,
          ),
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request error.'

      setMessages((currentMessages) =>
        currentMessages.map((entry) =>
          entry.id === replyId
            ? {
                ...entry,
                content: `OpenAI request failed: ${message}`,
              }
            : entry,
        ),
      )
    } finally {
      abortRef.current = null
      setIsTyping(false)
    }
  }

  const streamAssistantReplyFromCustomProvider = async (history) => {
    if (!customApiKey) {
      appendAssistantMessage('Custom provider API key is missing. Open Settings and add your key.')
      setIsTyping(false)
      return
    }

    const replyId = `assistant-${Date.now()}`
    const createdAt = formatTime(new Date())
    let combinedText = ''

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: replyId, role: 'assistant', content: '', createdAt },
    ])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(`${defaultCustomBaseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${customApiKey}`,
        },
        body: JSON.stringify({
          model: customModel,
          stream: true,
          messages: history.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || `API request failed with status ${response.status}`)
      }

      if (!response.body) {
        throw new Error('No response stream available from API.')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''

        for (const eventBlock of events) {
          const dataLines = eventBlock
            .split('\n')
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())

          for (const data of dataLines) {
            if (!data || data === '[DONE]') {
              continue
            }

            let parsed

            try {
              parsed = JSON.parse(data)
            } catch {
              continue
            }

            const delta = parsed?.choices?.[0]?.delta?.content

            if (delta) {
              combinedText += delta
              setMessages((currentMessages) =>
                currentMessages.map((message) =>
                  message.id === replyId
                    ? {
                        ...message,
                        content: combinedText,
                      }
                    : message,
                ),
              )
            }
          }
        }
      }

      if (!combinedText.trim()) {
        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === replyId
              ? {
                  ...message,
                  content: 'No text was returned for this request. Please try again.',
                }
              : message,
          ),
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request error.'

      setMessages((currentMessages) =>
        currentMessages.map((entry) =>
          entry.id === replyId
            ? {
                ...entry,
                content: `Custom provider request failed: ${message}`,
              }
            : entry,
        ),
      )
    } finally {
      abortRef.current = null
      setIsTyping(false)
    }
  }

  const fetchAssistantReplyFromGemini = async (history) => {
    if (!geminiApiKey) {
      appendAssistantMessage('Gemini API key is missing. Open Settings and add your key.')
      setIsTyping(false)
      return
    }

    const replyId = `assistant-${Date.now()}`
    const createdAt = formatTime(new Date())

    setMessages((currentMessages) => [
      ...currentMessages,
      { id: replyId, role: 'assistant', content: '', createdAt },
    ])

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: history.map((message) => ({
              role: message.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: message.content }],
            })),
          }),
          signal: controller.signal,
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        let parsedError = null

        try {
          parsedError = JSON.parse(errorText)
        } catch {
          parsedError = null
        }

        const friendlyError = getGeminiFriendlyError(
          response.status,
          parsedError,
          errorText || `API request failed with status ${response.status}`,
        )

        throw new Error(friendlyError)
      }

      const data = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('')?.trim()

      setMessages((currentMessages) =>
        currentMessages.map((entry) =>
          entry.id === replyId
            ? {
                ...entry,
                content: text || 'No text was returned for this request. Please try again.',
              }
            : entry,
        ),
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown request error.'

      setMessages((currentMessages) =>
        currentMessages.map((entry) =>
          entry.id === replyId
            ? {
                ...entry,
                content: `Gemini request failed: ${message}`,
              }
            : entry,
        ),
      )
    } finally {
      abortRef.current = null
      setIsTyping(false)
    }
  }

  const requestAssistantReply = async (history) => {
    if (provider === 'openai') {
      await streamAssistantReplyFromOpenAI(history)
      return
    }

    if (provider === 'gemini') {
      await fetchAssistantReplyFromGemini(history)
      return
    }

    if (provider === 'custom') {
      await streamAssistantReplyFromCustomProvider(history)
      return
    }

    if (provider === 'copilot') {
      appendAssistantMessage('GitHub Copilot does not currently provide a public API key endpoint for this custom chat app. Please switch to Ollama, OpenAI, or Gemini.')
      setIsTyping(false)
      return
    }

    await streamAssistantReplyFromOllama(history)
  }

  const sendMessage = () => {
    const trimmedDraft = draft.trim()

    if (!trimmedDraft || isTyping) {
      return
    }

    stopPendingResponse()

    const nextUserMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmedDraft,
      createdAt: formatTime(new Date()),
    }

    const nextHistory = [...messages, nextUserMessage]
    setMessages(nextHistory)
    setDraft('')
    setIsTyping(true)

    responseDelayRef.current = window.setTimeout(() => {
      requestAssistantReply(nextHistory)
      responseDelayRef.current = null
    }, 420)
  }

  const toggleTheme = () => {
    setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: themeMode === 'dark' ? '#00a884' : '#0d9488',
          colorInfo: themeMode === 'dark' ? '#00a884' : '#0d9488',
          borderRadius: 18,
          fontFamily: 'Segoe UI, Arial, sans-serif',
        },
      }}
    >
      <div className={`h-dvh overflow-hidden p-0 text-slate-900 lg:p-4 ${themeMode === 'dark' ? 'theme-dark' : 'theme-light'}`}>
        <div className="app-shell mx-auto flex h-full max-w-6xl overflow-hidden shadow-[0_18px_48px_rgba(0,0,0,0.22)] lg:rounded-[20px]">
          <div className="flex w-full flex-col">
            <header className="app-header flex flex-wrap items-center gap-2 border-b px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
              <Avatar size={40} icon={<RobotOutlined />} className="bg-[#00a884]! sm:h-11! sm:w-11!" />
              <div className="min-w-0 flex-1">
                <Text className="app-title-text block text-base! font-medium!">ChatBuddy</Text>
                <Text className="app-subtle-text block text-xs!">
                  {getProviderLabel(provider)}
                  {' • '}
                  {provider === 'openai'
                    ? openaiModel
                    : provider === 'gemini'
                      ? geminiModel
                      : provider === 'custom'
                        ? customModel
                        : provider === 'copilot'
                          ? 'not available'
                          : ollamaModel}
                </Text>
              </div>
              <Button
                type="default"
                icon={<ClockCircleOutlined />}
                className="header-action-btn rounded-full! px-2! sm:px-3!"
                onClick={() => setIsHistoryModalOpen(true)}
              >
                <span className="hidden sm:inline">History</span>
              </Button>
              <Button
                type="default"
                icon={<DeleteOutlined />}
                className="header-action-btn rounded-full! px-2! sm:px-3!"
                onClick={clearChat}
              >
                <span className="hidden sm:inline">Clear</span>
              </Button>
              <Button
                type="default"
                icon={<SettingOutlined />}
                className="header-action-btn rounded-full! px-2! sm:px-3!"
                onClick={() => setIsSettingsModalOpen(true)}
              >
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <Button
                type="default"
                icon={themeMode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                className="header-action-btn rounded-full! px-2! sm:px-3!"
                onClick={toggleTheme}
              >
                <span className="hidden sm:inline">{themeMode === 'dark' ? 'Light' : 'Dark'}</span>
              </Button>
            </header>

            <main className="chat-wallpaper flex min-h-0 flex-1 px-2 py-3 sm:px-4 md:px-6">
              <div ref={chatBodyRef} className="chat-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar size={34} icon={<RobotOutlined />} className="mb-1 shrink-0 bg-[#00a884]!" />
                    )}

                    <div
                      className={`message-shell max-w-[88%] rounded-xl px-3 py-2 sm:max-w-[80%] lg:max-w-[70%] ${
                        message.role === 'user'
                          ? 'chat-bubble-user rounded-br-sm'
                          : 'chat-bubble-assistant rounded-bl-sm'
                      }`}
                    >
                      <Paragraph
                        className={`mb-0! whitespace-pre-line! text-[14px]! leading-6! ${
                          message.role === 'user' ? 'text-[#111b21]!' : 'assistant-message-text'
                        }`}
                      >
                        {message.content || ' '}
                      </Paragraph>
                      <div className="mt-1 flex justify-end">
                        <span
                          className={`text-[11px] ${
                            message.role === 'user' ? 'text-[#667781]' : 'text-[#aebac1]'
                          }`}
                        >
                          {message.createdAt}
                        </span>
                      </div>
                    </div>

                    {message.role === 'user' && (
                      <Avatar size={34} icon={<UserOutlined />} className="mb-1 shrink-0 bg-[#54656f]!" />
                    )}
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-end gap-2">
                    <Avatar size={34} icon={<RobotOutlined />} className="mb-1 shrink-0 bg-[#00a884]!" />
                    <div className="chat-bubble-assistant rounded-xl rounded-bl-sm px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="typing-dot typing-dot-light" />
                        <span className="typing-dot typing-dot-light" />
                        <span className="typing-dot typing-dot-light" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>

            <footer className="app-header border-t px-2 py-2 sm:px-4 sm:py-3">
              <div className="composer-shell flex flex-col gap-2 rounded-2xl border px-2 py-2 sm:px-3">
                <div className="flex items-center justify-between gap-2 px-1">
                  <Text className="app-subtle-text text-[11px]!">Press Enter to send • Shift+Enter for new line</Text>
                  {draft.trim() && (
                    <Button size="small" type="text" onClick={() => setDraft('')}>
                      Clear draft
                    </Button>
                  )}
                </div>

                <div className="flex items-end gap-2 sm:gap-3">
                <Input.TextArea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onPressEnter={(event) => {
                    if (!event.shiftKey) {
                      event.preventDefault()
                      sendMessage()
                    }
                  }}
                  autoSize={{ minRows: 1, maxRows: 6 }}
                  placeholder="Type a message"
                  className="whatsapp-composer composer-input rounded-[14px]! border-0! px-3! py-2! shadow-none!"
                />
                <Button
                  type="primary"
                  shape="circle"
                  size="large"
                  icon={<SendOutlined />}
                  className="send-btn flex h-10! min-h-10! w-10! min-w-10! items-center justify-center rounded-full! border-0! sm:h-12! sm:min-h-12! sm:w-12! sm:min-w-12!"
                  disabled={!draft.trim() || isTyping}
                  onClick={sendMessage}
                />
                </div>
              </div>
            </footer>
          </div>
        </div>
      </div>

      <Modal
        title="Chat History"
        open={isHistoryModalOpen}
        footer={null}
        onCancel={() => setIsHistoryModalOpen(false)}
      >
        <div className="mb-3 flex items-center justify-between">
          <Text className="text-sm! text-slate-500!">Saved chats: {history.length}</Text>
          <Button danger size="small" onClick={clearAllHistory} disabled={history.length === 0}>
            Clear all history
          </Button>
        </div>

        <div className="max-h-[52vh] space-y-2 overflow-y-auto pr-1">
          {history.length === 0 && (
            <div className="rounded-lg bg-slate-50 px-3 py-4 text-sm text-slate-500">
              No history yet. Use chat and press Clear to archive a conversation.
            </div>
          )}

          {history.map((entry) => (
            <div key={entry.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Text className="block truncate text-sm! font-medium! text-slate-800!">{entry.title}</Text>
                  <Text className="mt-1 block text-xs! text-slate-500!">
                    {new Date(entry.updatedAt).toLocaleString()}
                  </Text>
                </div>
                <Button
                  danger
                  type="text"
                  size="small"
                  icon={<DeleteOutlined />}
                  onClick={() => deleteHistoryConversation(entry.id)}
                />
              </div>

              <Text className="mt-2 block text-xs! text-slate-500!">{entry.preview}</Text>

              <div className="mt-3">
                <Button size="small" onClick={() => loadHistoryConversation(entry)}>
                  Open chat
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title="Provider Settings"
        open={isSettingsModalOpen}
        okText="Save"
        cancelText="Cancel"
        onOk={saveProviderSettings}
        onCancel={() => {
          setProviderDraft(provider)
          setOllamaUrlDraft(ollamaUrl)
          setOllamaModelDraft(ollamaModel)
          setOpenaiApiKeyDraft(openaiApiKey)
          setOpenaiModelDraft(openaiModel)
          setGeminiApiKeyDraft(geminiApiKey)
          setGeminiModelDraft(geminiModel)
          setCustomApiKeyDraft(customApiKey)
          setCustomModelDraft(customModel)
          setConnectionStatus({ type: '', message: '' })
          setIsSettingsModalOpen(false)
        }}
      >
        <p className="mb-3 text-sm text-slate-600">
          Choose your provider and configure credentials or local runtime details.
        </p>

        <label className="mb-1 block text-xs font-medium text-slate-500">Provider</label>
        <Select
          value={providerDraft}
          onChange={(value) => setProviderDraft(value)}
          options={providerOptions}
          className="w-full"
        />

        {providerDraft === 'ollama' && (
          <>
            <label className="mb-1 mt-3 block text-xs font-medium text-slate-500">Ollama URL</label>
            <Input
              value={ollamaUrlDraft}
              onChange={(event) => setOllamaUrlDraft(event.target.value)}
              placeholder="http://localhost:11434"
              autoComplete="off"
            />

            <label className="mb-1 mt-3 block text-xs font-medium text-slate-500">Model name</label>
            <Input
              value={ollamaModelDraft}
              onChange={(event) => setOllamaModelDraft(event.target.value)}
              placeholder="llama3.2:3b"
              autoComplete="off"
            />
          </>
        )}

        {providerDraft === 'openai' && (
          <>
            <label className="mb-1 mt-3 block text-xs font-medium text-slate-500">OpenAI API key</label>
            <Input.Password
              value={openaiApiKeyDraft}
              onChange={(event) => setOpenaiApiKeyDraft(event.target.value)}
              placeholder="sk-..."
              autoComplete="off"
            />

            <label className="mb-1 mt-3 block text-xs font-medium text-slate-500">Model name</label>
            <Input
              value={openaiModelDraft}
              onChange={(event) => setOpenaiModelDraft(event.target.value)}
              placeholder="gpt-4.1-mini"
              autoComplete="off"
            />

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button onClick={loadOpenAIModels} loading={isLoadingOpenAIModels}>
                Load Models
              </Button>

              {openaiModels.length > 0 && (
                <Select
                  value={openaiModelDraft}
                  onChange={(value) => setOpenaiModelDraft(value)}
                  options={openaiModels.map((name) => ({ value: name, label: name }))}
                  className="w-full sm:max-w-[320px]"
                  showSearch
                  optionFilterProp="label"
                />
              )}
            </div>
          </>
        )}

        {providerDraft === 'gemini' && (
          <>
            <label className="mb-1 mt-3 block text-xs font-medium text-slate-500">Gemini API key</label>
            <Input.Password
              value={geminiApiKeyDraft}
              onChange={(event) => setGeminiApiKeyDraft(event.target.value)}
              placeholder="AIza..."
              autoComplete="off"
            />

            <label className="mb-1 mt-3 block text-xs font-medium text-slate-500">Model name</label>
            <Input
              value={geminiModelDraft}
              onChange={(event) => setGeminiModelDraft(event.target.value)}
              placeholder="gemini-1.5-flash"
              autoComplete="off"
            />

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button onClick={loadGeminiModels} loading={isLoadingGeminiModels}>
                Load Models
              </Button>

              {geminiModels.length > 0 && (
                <Select
                  value={geminiModelDraft}
                  onChange={(value) => setGeminiModelDraft(value)}
                  options={geminiModels.map((name) => ({ value: name, label: name }))}
                  className="w-full sm:max-w-[320px]"
                  showSearch
                  optionFilterProp="label"
                />
              )}
            </div>
          </>
        )}

        {providerDraft === 'copilot' && (
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-3 text-xs text-amber-700">
            GitHub Copilot currently does not offer a public API key-based endpoint for this standalone app. Use Ollama, OpenAI, or Gemini instead.
          </div>
        )}

        {providerDraft === 'custom' && (
          <>
            <label className="mb-1 mt-3 block text-xs font-medium text-slate-500">Custom API key</label>
            <Input.Password
              value={customApiKeyDraft}
              onChange={(event) => setCustomApiKeyDraft(event.target.value)}
              placeholder="Enter API key"
              autoComplete="off"
            />

            <label className="mb-1 mt-3 block text-xs font-medium text-slate-500">Model name</label>
            <Input
              value={customModelDraft}
              onChange={(event) => setCustomModelDraft(event.target.value)}
              placeholder="openai/gpt-4o-mini"
              autoComplete="off"
            />

            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button onClick={loadCustomModels} loading={isLoadingCustomModels}>
                Load Models
              </Button>

              {customModels.length > 0 && (
                <Select
                  value={customModelDraft}
                  onChange={(value) => setCustomModelDraft(value)}
                  options={customModels.map((name) => ({ value: name, label: name }))}
                  className="w-full sm:max-w-[320px]"
                  showSearch
                  optionFilterProp="label"
                />
              )}
            </div>
          </>
        )}

        <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Button onClick={testProviderConnection} loading={isTestingConnection}>
            Test Connection
          </Button>
          {connectionStatus.message && (
            <Text
              className={`text-xs! ${
                connectionStatus.type === 'success'
                  ? 'text-green-600!'
                  : connectionStatus.type === 'warning'
                    ? 'text-amber-600!'
                    : 'text-red-600!'
              }`}
            >
              {connectionStatus.message}
            </Text>
          )}
        </div>
      </Modal>
    </ConfigProvider>
  )
}

export default App
