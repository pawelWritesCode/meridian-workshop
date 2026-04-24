<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="isOpen && backlogItem" class="modal-overlay" @click="close">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">{{ mode === 'create' ? 'Create Purchase Order' : 'Purchase Order Details' }}</h3>
            <button class="close-button" @click="close">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="item-summary">
              <div class="item-name">{{ backlogItem.item_name }}</div>
              <div class="item-meta">SKU: {{ backlogItem.item_sku }} · Needed: {{ backlogItem.quantity_needed }} units</div>
            </div>

            <!-- View mode: show existing PO -->
            <div v-if="mode === 'view' && existingPO" class="po-details">
              <div class="detail-grid">
                <div class="detail-item">
                  <div class="detail-label">PO ID</div>
                  <div class="detail-value mono">{{ existingPO.id }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Supplier</div>
                  <div class="detail-value">{{ existingPO.supplier_name }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Quantity</div>
                  <div class="detail-value">{{ existingPO.quantity }} units</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Unit Cost</div>
                  <div class="detail-value">{{ formatCurrency(existingPO.unit_cost) }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Total Cost</div>
                  <div class="detail-value strong">{{ formatCurrency(existingPO.quantity * existingPO.unit_cost) }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Expected Delivery</div>
                  <div class="detail-value">{{ formatDate(existingPO.expected_delivery_date) }}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Status</div>
                  <div class="detail-value"><span class="badge" :class="statusClass(existingPO.status)">{{ existingPO.status }}</span></div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Created</div>
                  <div class="detail-value">{{ formatDate(existingPO.created_date) }}</div>
                </div>
              </div>
              <div v-if="existingPO.notes" class="notes-section">
                <div class="detail-label">Notes</div>
                <div class="notes-value">{{ existingPO.notes }}</div>
              </div>
            </div>

            <div v-if="mode === 'view' && loadingPO" class="loading-state">Loading purchase order…</div>
            <div v-if="mode === 'view' && poError" class="error-state">{{ poError }}</div>

            <!-- Create mode: form -->
            <form v-if="mode === 'create'" @submit.prevent="submitForm" class="po-form">
              <div class="form-group">
                <label>Supplier Name *</label>
                <input v-model="form.supplier_name" type="text" required placeholder="e.g. Acme Parts Co." />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Quantity *</label>
                  <input v-model.number="form.quantity" type="number" min="1" required :placeholder="backlogItem.quantity_needed" />
                </div>
                <div class="form-group">
                  <label>Unit Cost (USD) *</label>
                  <input v-model.number="form.unit_cost" type="number" min="0.01" step="0.01" required placeholder="0.00" />
                </div>
              </div>
              <div class="form-group">
                <label>Expected Delivery Date *</label>
                <input v-model="form.expected_delivery_date" type="date" required />
              </div>
              <div class="form-group">
                <label>Notes</label>
                <textarea v-model="form.notes" rows="3" placeholder="Optional notes for supplier or procurement team" />
              </div>
              <div v-if="form.quantity && form.unit_cost" class="total-preview">
                Total: <strong>{{ formatCurrency(form.quantity * form.unit_cost) }}</strong>
              </div>
              <div v-if="submitError" class="error-state">{{ submitError }}</div>
            </form>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="close">{{ mode === 'create' ? 'Cancel' : 'Close' }}</button>
            <button v-if="mode === 'create'" class="btn-primary" :disabled="submitting" @click="submitForm">
              {{ submitting ? 'Creating…' : 'Create Purchase Order' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { api } from '@/api'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  backlogItem: { type: Object, default: null },
  mode: { type: String, default: 'create' }
})

const emit = defineEmits(['close', 'po-created'])

const existingPO = ref(null)
const loadingPO = ref(false)
const poError = ref(null)

const form = ref({ supplier_name: '', quantity: null, unit_cost: null, expected_delivery_date: '', notes: '' })
const submitting = ref(false)
const submitError = ref(null)

watch(() => [props.isOpen, props.mode, props.backlogItem], async ([open, mode, item]) => {
  if (!open || !item) return
  if (mode === 'view') {
    loadingPO.value = true
    poError.value = null
    existingPO.value = null
    try {
      existingPO.value = await api.getPurchaseOrderByBacklogItem(item.id)
    } catch {
      poError.value = 'Could not load purchase order details.'
    } finally {
      loadingPO.value = false
    }
  } else {
    form.value = { supplier_name: '', quantity: item.quantity_needed, unit_cost: null, expected_delivery_date: '', notes: '' }
    submitError.value = null
  }
}, { immediate: true })

const submitForm = async () => {
  submitting.value = true
  submitError.value = null
  try {
    const po = await api.createPurchaseOrder({
      backlog_item_id: props.backlogItem.id,
      supplier_name: form.value.supplier_name,
      quantity: form.value.quantity,
      unit_cost: form.value.unit_cost,
      expected_delivery_date: form.value.expected_delivery_date,
      notes: form.value.notes || undefined
    })
    emit('po-created', po)
  } catch {
    submitError.value = 'Failed to create purchase order. Please try again.'
  } finally {
    submitting.value = false
  }
}

const close = () => emit('close')

const formatCurrency = (val) => val?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) ?? '—'
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'
const statusClass = (s) => ({ pending: 'warning', approved: 'success', delivered: 'success', cancelled: 'danger' }[s?.toLowerCase()] ?? '')
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
  max-width: 560px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.025em;
}

.close-button {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.close-button:hover { background: #f1f5f9; color: #0f172a; }

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.item-summary {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.item-name { font-weight: 600; color: #0f172a; margin-bottom: 0.25rem; }
.item-meta { font-size: 0.875rem; color: #64748b; }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.detail-item { display: flex; flex-direction: column; gap: 0.25rem; }
.detail-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
.detail-value { font-size: 0.938rem; color: #0f172a; font-weight: 500; }
.detail-value.mono { font-family: 'Monaco', 'Courier New', monospace; color: #2563eb; }
.detail-value.strong { font-weight: 700; }

.notes-section { margin-top: 1rem; display: flex; flex-direction: column; gap: 0.25rem; }
.notes-value { font-size: 0.875rem; color: #475569; line-height: 1.5; }

.po-form { display: flex; flex-direction: column; gap: 1rem; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

.form-group { display: flex; flex-direction: column; gap: 0.375rem; }

.form-group label { font-size: 0.875rem; font-weight: 600; color: #374151; }

.form-group input,
.form-group textarea {
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
  transition: border-color 0.15s ease;
  outline: none;
}

.form-group input:focus,
.form-group textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }

.form-group textarea { resize: vertical; }

.total-preview {
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  font-size: 0.938rem;
  color: #1e40af;
}

.loading-state { color: #64748b; font-size: 0.875rem; }
.error-state { color: #dc2626; font-size: 0.875rem; }

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-secondary {
  padding: 0.625rem 1.25rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-secondary:hover { background: #e2e8f0; border-color: #cbd5e1; }

.btn-primary {
  padding: 0.625rem 1.25rem;
  background: #2563eb;
  border: 1px solid transparent;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  color: white;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.badge { padding: 0.25rem 0.625rem; border-radius: 999px; font-size: 0.75rem; font-weight: 600; text-transform: capitalize; }
.badge.warning { background: #fef9c3; color: #854d0e; }
.badge.success { background: #dcfce7; color: #166534; }
.badge.danger { background: #fee2e2; color: #991b1b; }

.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-container, .modal-leave-active .modal-container { transition: transform 0.2s ease; }
.modal-enter-from .modal-container, .modal-leave-to .modal-container { transform: scale(0.95); }
</style>
