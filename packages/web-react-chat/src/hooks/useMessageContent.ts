import { useState, useEffect } from 'react'
import useTask from './useTask'

export default function useMessageContent(messageId: string) {
  const [messageContent, setMessageContent] = useState('')
  const task = useTask()

  useEffect(() => {
    const unsubscribe = task.on('change-message-content', (event) => {
      if (event.messageId !== messageId) return

      setMessageContent(event.content)
    })

    const message = task.getMessageById(messageId)
    setMessageContent(message?.content || '')

    return () => {
      unsubscribe()
    }
  }, [messageId])

  return messageContent
}
