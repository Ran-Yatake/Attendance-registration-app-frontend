"use client"
import { useState, useEffect } from "react"

type Memo = { id: number; title: string; content: string }

export default function Page() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")

  useEffect(() => {
    fetch("http://localhost:8080/api/memos")
      .then(res => res.json())
      .then(data => setMemos(data))
  }, [])

  const addMemo = async () => {
    await fetch("http://localhost:8080/api/memos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    })
    setTitle("")
    setContent("")
    // 再取得
    const data = await fetch("http://localhost:8080/api/memos").then(res => res.json())
    setMemos(data)
  }

  return (
    <div>
      <h1>メモアプリ</h1>
      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="タイトル" />
      <input value={content} onChange={e => setContent(e.target.value)} placeholder="内容" />
      <button onClick={addMemo}>追加</button>

      <ul>
        {memos.map(m => (
          <li key={m.id}>
            <strong>{m.title}</strong> - {m.content}
          </li>
        ))}
      </ul>
    </div>
  )
}
