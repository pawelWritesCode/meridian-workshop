<template>
  <div class="restocking">
    <div class="page-header">
      <div>
        <h2>{{ t('restocking.title') }}</h2>
        <p>{{ t('restocking.description') }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <!-- Budget input -->
      <div class="budget-bar">
        <label class="budget-label" for="budget-input">{{ t('restocking.budgetCeiling') }}</label>
        <div class="budget-input-wrapper">
          <span class="currency-symbol">$</span>
          <input
            id="budget-input"
            v-model.number="budget"
            type="number"
            min="0"
            step="1000"
            class="budget-input"
          />
        </div>
      </div>

      <!-- Summary stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">{{ t('restocking.stats.itemsNeedingRestock') }}</div>
          <div class="stat-value">{{ recommendations.length }}</div>
        </div>
        <div class="stat-card success">
          <div class="stat-label">{{ t('restocking.stats.itemsWithinBudget') }}</div>
          <div class="stat-value">{{ summaryStats.withinBudgetCount }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('restocking.stats.totalEstimatedSpend') }}</div>
          <div class="stat-value">${{ formatNumber(summaryStats.totalSpend) }}</div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="recommendations.length === 0" class="empty-state">
        <div class="empty-icon">✓</div>
        <p>{{ t('restocking.noRecommendations') }}</p>
      </div>

      <!-- Recommendations table -->
      <div v-else class="card">
        <div class="table-container">
          <table class="restocking-table">
            <thead>
              <tr>
                <th>{{ t('restocking.table.sku') }}</th>
                <th>{{ t('restocking.table.name') }}</th>
                <th>{{ t('restocking.table.category') }}</th>
                <th>{{ t('restocking.table.warehouse') }}</th>
                <th class="num">{{ t('restocking.table.onHand') }}</th>
                <th class="num">{{ t('restocking.table.reorderPoint') }}</th>
                <th class="num">{{ t('restocking.table.forecastedDemand') }}</th>
                <th>{{ t('restocking.table.trend') }}</th>
                <th class="num">{{ t('restocking.table.recommendedQty') }}</th>
                <th class="num">{{ t('restocking.table.estimatedCost') }}</th>
                <th>{{ t('restocking.table.budgetStatus') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in recommendations" :key="item.sku" :class="{ 'row-critical': item.urgency === 'critical' }">
                <td class="sku">{{ item.sku }}</td>
                <td>{{ item.name }}</td>
                <td>{{ item.category }}</td>
                <td>{{ item.warehouse }}</td>
                <td class="num" :class="{ 'text-danger': item.urgency === 'critical' }">
                  <strong>{{ item.quantity_on_hand }}</strong>
                </td>
                <td class="num">{{ item.reorder_point }}</td>
                <td class="num">{{ item.forecasted_demand }}</td>
                <td>
                  <span :class="['badge', trendClass(item.trend)]">{{ item.trend }}</span>
                </td>
                <td class="num"><strong>{{ item.recommended_qty }}</strong></td>
                <td class="num">${{ formatNumber(item.estimated_cost) }}</td>
                <td>
                  <span :class="['badge', item.within_budget ? 'success' : 'over-budget']">
                    {{ item.within_budget ? t('restocking.status.withinBudget') : t('restocking.status.exceedsBudget') }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '@/api'
import { useFilters } from '@/composables/useFilters'
import { useI18n } from '@/composables/useI18n'

export default {
  name: 'Restocking',
  setup() {
    const { t } = useI18n()
    const { selectedLocation, selectedCategory, getCurrentFilters } = useFilters()

    const loading = ref(true)
    const error = ref(null)
    const inventoryItems = ref([])
    const forecasts = ref([])
    const budget = ref(50000)

    const formatNumber = (num) => {
      if (num == null || isNaN(num)) return '0.00'
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }

    const trendClass = (trend) => {
      if (trend === 'increasing') return 'trend-up'
      if (trend === 'decreasing') return 'trend-down'
      return 'trend-stable'
    }

    const recommendations = computed(() => {
      const forecastMap = {}
      forecasts.value.forEach(f => { forecastMap[f.item_sku] = f })

      const items = inventoryItems.value
        .map(item => {
          const forecast = forecastMap[item.sku]
          if (!forecast) return null

          const needsRestock =
            item.quantity_on_hand <= item.reorder_point ||
            forecast.forecasted_demand > item.quantity_on_hand

          if (!needsRestock) return null

          const recommended_qty = Math.max(
            forecast.forecasted_demand + item.reorder_point - item.quantity_on_hand,
            1
          )
          const estimated_cost = recommended_qty * item.unit_cost
          const urgency = item.quantity_on_hand <= item.reorder_point ? 'critical' : 'watch'

          return {
            sku: item.sku,
            name: item.name,
            category: item.category,
            warehouse: item.warehouse,
            quantity_on_hand: item.quantity_on_hand,
            reorder_point: item.reorder_point,
            forecasted_demand: forecast.forecasted_demand,
            trend: forecast.trend,
            recommended_qty,
            estimated_cost,
            urgency
          }
        })
        .filter(Boolean)

      // Sort: critical first, then increasing trend, then alphabetical
      items.sort((a, b) => {
        if (a.urgency !== b.urgency) return a.urgency === 'critical' ? -1 : 1
        if (a.trend !== b.trend) {
          if (a.trend === 'increasing') return -1
          if (b.trend === 'increasing') return 1
        }
        return a.sku.localeCompare(b.sku)
      })

      // Apply budget soft indicator
      let runningTotal = 0
      return items.map(item => {
        const fits = (runningTotal + item.estimated_cost) <= budget.value
        if (fits) runningTotal += item.estimated_cost
        return { ...item, within_budget: fits }
      })
    })

    const summaryStats = computed(() => ({
      withinBudgetCount: recommendations.value.filter(r => r.within_budget).length,
      totalSpend: recommendations.value.reduce((sum, r) => sum + r.estimated_cost, 0)
    }))

    const loadData = async () => {
      try {
        loading.value = true
        error.value = null
        const filters = getCurrentFilters()
        const [inventory, demandForecasts] = await Promise.all([
          api.getInventory(filters),
          api.getDemandForecasts()
        ])
        inventoryItems.value = inventory
        forecasts.value = demandForecasts
      } catch (err) {
        error.value = 'Failed to load data: ' + err.message
      } finally {
        loading.value = false
      }
    }

    onMounted(loadData)
    watch([selectedLocation, selectedCategory], loadData)

    return {
      t, loading, error, budget,
      recommendations, summaryStats,
      formatNumber, trendClass
    }
  }
}
</script>

<style scoped>
.restocking { padding: 0; }

.page-header {
  margin-bottom: 1.5rem;
}

.page-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.page-header p {
  font-size: 0.875rem;
  color: #64748b;
}

.budget-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border: 1px solid #e2e8f0;
}

.budget-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.budget-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  max-width: 200px;
}

.currency-symbol {
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-right: 1px solid #d1d5db;
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 600;
}

.budget-input {
  border: none;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-family: inherit;
  color: #0f172a;
  width: 140px;
  outline: none;
}

.budget-input:focus { background: #f0f9ff; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  border-left: 4px solid #3b82f6;
}

.stat-card.success { border-left-color: #22c55e; }

.stat-label {
  font-size: 0.813rem;
  color: #64748b;
  font-weight: 500;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #0f172a;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  overflow: hidden;
}

.table-container { overflow-x: auto; }

.restocking-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.restocking-table th {
  background: #f8fafc;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.75rem;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.restocking-table th.num,
.restocking-table td.num { text-align: right; }

.restocking-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}

.restocking-table tr:last-child td { border-bottom: none; }
.restocking-table tr:hover td { background: #f8fafc; }

.row-critical td { background: #fff8f8; }
.row-critical:hover td { background: #fef2f2; }

.sku {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.813rem;
  color: #2563eb;
  font-weight: 600;
}

.text-danger { color: #dc2626; }

.badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge.trend-up    { background: #dcfce7; color: #166534; }
.badge.trend-down  { background: #fee2e2; color: #991b1b; }
.badge.trend-stable { background: #f1f5f9; color: #475569; }
.badge.success     { background: #dcfce7; color: #166534; }
.badge.over-budget { background: #fef9c3; color: #854d0e; }

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #64748b;
}

.empty-icon {
  font-size: 2.5rem;
  color: #22c55e;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #64748b;
}

.error {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}
</style>
