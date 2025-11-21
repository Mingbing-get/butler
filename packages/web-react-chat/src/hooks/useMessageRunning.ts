import { useState, useEffect } from 'react'
import useTask from './useTask'

export default function useMessageRunning(messageId: string) {
  const task = useTask()
  const [messageRunning, setMessageRunning] = useState(false)

  useEffect(() => {
    const unsubscribe = task.on('change-message-running', (event) => {
      if (event.messageId !== messageId) return

      setMessageRunning(event.running)
    })

    const message = task.getMessageById(messageId)
    setMessageRunning(message?.role === 'assistant' ? message.running : false)

    return () => {
      unsubscribe()
    }
  }, [messageId])

  return messageRunning
}
