import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import './dialog.css'

const DialogContext = createContext(null)

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null)

  const close = useCallback(() => setDialog(null), [])

  const alert = useCallback((opts) => {
    return new Promise((resolve) => {
      setDialog({ type: 'alert', resolve, ...opts })
    })
  }, [])

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setDialog({ type: 'confirm', resolve, ...opts })
    })
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (!dialog) return
      if (e.key === 'Escape') {
        if (dialog.type === 'confirm') {
          try { dialog.resolve(false) } catch {}
          close()
        } else {
          try { dialog.resolve() } catch {}
          close()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, close])

  const value = { alert, confirm }

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog && (
        <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
          <div className="dialog-backdrop" onClick={() => { try { if (dialog.type === 'confirm') dialog.resolve(false); else dialog.resolve() } catch {} close() }} />
          <div className="dialog-modal" onClick={(e) => e.stopPropagation()}>
            {dialog.icon && <div className="dialog-icon" aria-hidden>{dialog.icon}</div>}
            <h3 id="dialog-title" className="dialog-title">{dialog.title || (dialog.type === 'confirm' ? 'Confirmar' : 'Aviso')}</h3>
            {dialog.message && (
              <div className="dialog-message">{dialog.message}</div>
            )}
            {dialog.type === 'confirm' ? (
              <div className="dialog-actions">
                <button className="btn glass" onClick={() => { try { dialog.resolve(false) } catch {} close() }}>
                  {dialog.cancelText || 'Cancelar'}
                </button>
                <button className="btn primary" onClick={() => { try { dialog.resolve(true) } catch {} close() }}>
                  {dialog.okText || 'Confirmar'}
                </button>
              </div>
            ) : (
              <div className="dialog-actions">
                <button className="btn primary" onClick={() => { try { dialog.resolve() } catch {} close() }}>
                  {dialog.okText || 'OK'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) {
    throw new Error('useDialog must be used within a DialogProvider')
  }
  return ctx
}
