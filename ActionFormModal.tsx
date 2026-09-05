import React, { useEffect, useState } from 'react'
import type { ActionInput, ActionItem } from '../../types'
import { PRIORIDADE_OPTIONS, STATUS_ATUAL_OPTIONS } from '../../types'
import { Modal, Button, TextInput, TextArea, Select } from '../ui/Primitives'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (input: ActionInput) => void
  initial?: ActionItem | null
  lojaOptions: string[]
  pilarOptions: string[]
  responsavelOptions: string[]
}

const BLANK: ActionInput = {
  loja: '',
  publicoAlvo: '',
  demandaGap: '',
  pilar: '',
  acaoPilar: '',
  planoAcao: '',
  acao: '',
  produto: '',
  statusAtual: 'Mapeando',
  periodicidade: '',
  responsavel: '',
  prazo: '',
  prioridade: 'Média',
}

export function ActionFormModal({ open, onClose, onSubmit, initial, lojaOptions, pilarOptions, responsavelOptions }: Props) {
  const [form, setForm] = useState<ActionInput>(BLANK)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              loja: initial.loja,
              publicoAlvo: initial.publicoAlvo,
              demandaGap: initial.demandaGap,
              pilar: initial.pilar,
              acaoPilar: initial.acaoPilar,
              planoAcao: initial.planoAcao,
              acao: initial.acao,
              produto: initial.produto,
              statusAtual: initial.statusAtual,
              periodicidade: initial.periodicidade,
              responsavel: initial.responsavel,
              prazo: initial.prazo,
              prioridade: initial.prioridade,
            }
          : BLANK
      )
      setError(null)
    }
  }, [open, initial])

  function set<K extends keyof ActionInput>(key: K, value: ActionInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.publicoAlvo.trim() || !form.planoAcao.trim()) {
      setError('Público-alvo e Plano de Ação são obrigatórios.')
      return
    }
    onSubmit(form)
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar Ação' : 'Nova Ação'} wide>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-alert bg-alert/10 border border-alert/30 rounded-lg px-3 py-2">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Loja">
            <TextInput list="loja-options" value={form.loja} onChange={(e) => set('loja', e.target.value)} placeholder="Ex.: Hiper" />
            <datalist id="loja-options">
              {lojaOptions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </Field>

          <Field label="Público-alvo *">
            <TextInput
              value={form.publicoAlvo}
              onChange={(e) => set('publicoAlvo', e.target.value)}
              placeholder="Ex.: Gerência Regional"
              required
            />
          </Field>
        </div>

        <Field label="Demanda / Gap">
          <TextArea rows={2} value={form.demandaGap} onChange={(e) => set('demandaGap', e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Pilar">
            <TextInput list="pilar-options" value={form.pilar} onChange={(e) => set('pilar', e.target.value)} placeholder="Ex.: Gestão" />
            <datalist id="pilar-options">
              {pilarOptions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </Field>
          <Field label="Ação Pilar">
            <TextInput value={form.acaoPilar} onChange={(e) => set('acaoPilar', e.target.value)} />
          </Field>
        </div>

        <Field label="Plano de Ação *">
          <TextInput value={form.planoAcao} onChange={(e) => set('planoAcao', e.target.value)} required />
        </Field>

        <Field label="Ação">
          <TextArea rows={3} value={form.acao} onChange={(e) => set('acao', e.target.value)} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Produto / Entregável">
            <TextInput value={form.produto} onChange={(e) => set('produto', e.target.value)} />
          </Field>
          <Field label="Periodicidade">
            <TextInput value={form.periodicidade} onChange={(e) => set('periodicidade', e.target.value)} placeholder="Ex.: Quinzenal" />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Status Atual">
            <Select value={form.statusAtual} onChange={(v) => set('statusAtual', v as ActionInput['statusAtual'])} options={[...STATUS_ATUAL_OPTIONS]} />
          </Field>
          <Field label="Prioridade">
            <Select value={form.prioridade} onChange={(v) => set('prioridade', v as ActionInput['prioridade'])} options={[...PRIORIDADE_OPTIONS]} />
          </Field>
          <Field label="Prazo">
            <TextInput type="date" value={form.prazo} onChange={(e) => set('prazo', e.target.value)} />
          </Field>
        </div>

        <Field label="Responsável">
          <TextInput list="responsavel-options" value={form.responsavel} onChange={(e) => set('responsavel', e.target.value)} />
          <datalist id="responsavel-options">
            {responsavelOptions.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{initial ? 'Salvar alterações' : 'Criar ação'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-choc-dark/70 mb-1">{label}</span>
      {children}
    </label>
  )
}
