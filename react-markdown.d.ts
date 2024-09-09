declare module 'react-markdown' {
  import React from 'react'
  
  interface ReactMarkdownProps {
    children: string
    components?: Record<string, React.ComponentType<any>>
    className?: string
  }

  const ReactMarkdown: React.FC<ReactMarkdownProps>
  
  export default ReactMarkdown
}