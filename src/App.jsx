import { useState, useEffect } from 'react'
import './App.css'

const API = 'http://localhost:8080/api'

function App() {
  const [events, setEvents] = useState([])
  const [keyword, setKeyword] = useState('')
  const [alert, setAlert] = useState(null)
  const [modal, setModal] = useState(null)
  const [userId, setUserId] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newEvent, setNewEvent] = useState({ name: '', description: '', totalQuantity: '' })
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await fetch(`${API}/events`)
      if (res.ok) {
        const data = await res.json()
        setEvents(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.log('백엔드 연결 실패')
    }
  }

  const searchEvents = async () => {
    if (!keyword.trim()) {
      fetchEvents()
      return
    }
    try {
      const res = await fetch(`${API}/events/search?keyword=${encodeURIComponent(keyword)}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      showAlert('error', '검색 실패')
    }
  }

  const handleCreate = async () => {
    if (!newEvent.name.trim() || !newEvent.totalQuantity) {
      showAlert('error', '쿠폰 이름과 수량을 입력해주세요.')
      return
    }
    try {
      const params = new URLSearchParams({
        name: newEvent.name,
        description: newEvent.description,
        totalQuantity: newEvent.totalQuantity
      })
      const res = await fetch(`${API}/events?${params}`, { method: 'POST' })
      if (res.ok) {
        showAlert('success', '쿠폰 이벤트가 등록되었습니다!')
        setNewEvent({ name: '', description: '', totalQuantity: '' })
        setShowCreateForm(false)
        fetchEvents()
      }
    } catch (e) {
      showAlert('error', '등록 실패')
    }
  }

  const handleIssue = async (couponId) => {
    if (!userId.trim()) {
      showAlert('error', '유저 ID를 입력해주세요.')
      return
    }
    try {
      const res = await fetch(`${API}/coupons/${couponId}/issue?userId=${userId}`, {
        method: 'POST'
      })
      if (res.ok) {
        showAlert('success', '쿠폰 발급 완료!')
      } else {
        const text = await res.text()
        showAlert('error', text || '발급 실패')
      }
    } catch (e) {
      showAlert('error', '서버 오류')
    }
    setModal(null)
    setUserId('')
  }

  const handleChat = async () => {
    if (!chatInput.trim() || chatLoading) return

    const question = chatInput
    setChatMessages(prev => [...prev, { role: 'user', content: question }])
    setChatInput('')
    setChatLoading(true)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      if (res.ok) {
        const data = await res.json()
        setChatMessages(prev => [...prev, { role: 'ai', content: data.answer }])
      } else {
        setChatMessages(prev => [...prev, { role: 'ai', content: '답변을 가져올 수 없습니다.' }])
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: 'ai', content: '서버 연결 실패' }])
    }
    setChatLoading(false)
  }

  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter') handleChat()
  }

  const showAlert = (type, message) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 3000)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') searchEvents()
  }

  return (
    <div>
      <div className="header">
        <h1>Coupon Event</h1>
        <p>선착순 쿠폰을 발급받으세요!</p>
      </div>

      {alert && (
        <div className={`alert ${alert.type}`}>
          {alert.message}
        </div>
      )}

      {/* 이벤트 등록 폼 */}
      <div className="create-section">
        {!showCreateForm ? (
          <button className="create-toggle-btn" onClick={() => setShowCreateForm(true)}>
            + 새 쿠폰 이벤트 등록
          </button>
        ) : (
          <div className="create-form">
            <h3>쿠폰 이벤트 등록</h3>
            <input
              type="text"
              placeholder="쿠폰 이름"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="쿠폰 설명"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
            />
            <input
              type="number"
              placeholder="총 수량"
              value={newEvent.totalQuantity}
              onChange={(e) => setNewEvent({ ...newEvent, totalQuantity: e.target.value })}
            />
            <div className="create-buttons">
              <button className="confirm" onClick={handleCreate}>등록</button>
              <button className="cancel" onClick={() => setShowCreateForm(false)}>취소</button>
            </div>
          </div>
        )}
      </div>

      {/* 검색 */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="쿠폰 이벤트를 검색해보세요..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button onClick={searchEvents}>검색</button>
      </div>

      {/* 쿠폰 목록 */}
      <div className="coupon-list">
        {events.length === 0 ? (
          <div className="empty-state">
            <div className="emoji">🎫</div>
            <p>등록된 쿠폰 이벤트가 없습니다.</p>
          </div>
        ) : (
          events.map((event) => (
            <div className="coupon-card" key={event.id}>
              <div className="coupon-info">
                <h3>{event.name}</h3>
                <p>{event.description}</p>
                <p className="quantity">총 {event.totalQuantity}장</p>
              </div>
              <button
                className="issue-btn"
                onClick={() => setModal(event)}
              >
                발급받기
              </button>
            </div>
          ))
        )}
      </div>

      {/* AI 챗봇 버튼 */}
      <button className="chat-fab" onClick={() => setChatOpen(!chatOpen)}>
        {chatOpen ? '✕' : 'AI'}
      </button>

      {/* AI 챗봇 */}
      {chatOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>AI 쿠폰 도우미</span>
          </div>
          <div className="chat-body">
            {chatMessages.length === 0 && (
              <div className="chat-empty">쿠폰에 대해 무엇이든 물어보세요!</div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}`}>
                <div className="chat-bubble">{msg.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="chat-msg ai">
                <div className="chat-bubble loading">답변 생성 중...</div>
              </div>
            )}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="질문을 입력하세요..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleChatKeyDown}
            />
            <button onClick={handleChat} disabled={chatLoading}>전송</button>
          </div>
        </div>
      )}

      {/* 발급 모달 */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{modal.name}</h2>
            <p className="desc">{modal.description}</p>
            <input
              type="number"
              placeholder="유저 ID를 입력하세요"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <div className="modal-buttons">
              <button className="confirm" onClick={() => handleIssue(modal.id)}>
                발급받기
              </button>
              <button className="cancel" onClick={() => setModal(null)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
