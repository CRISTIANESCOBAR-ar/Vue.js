<template>
  <div class="w-full h-screen flex flex-col p-1">
    <main class="w-full flex-1 min-h-0 bg-white rounded-2xl shadow-xl px-4 py-3 border border-slate-200 flex flex-col">
      <div class="flex flex-col gap-2 mb-3 flex-shrink-0">
        <!-- Single top row: title, search, filters (center), refresh -->
        <div class="flex items-center gap-2">
          <h3 class="text-xl font-semibold text-slate-800 whitespace-nowrap">Resumen de Ensayos</h3>

          <!-- search moved next to title -->
          <div class="ml-4 flex items-center">
            <label for="searchInput" class="sr-only">Buscar ensayos</label>
            <input id="searchInput" v-model="q" @input="onInput" type="search"
              placeholder="Buscar por Ensayo, Fecha, OE, Ne..." aria-label="Buscar ensayos"
              class="px-3 py-1.5 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
            <button v-if="q" @click="clearSearch" title="Limpiar"
              class="ml-2 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-sm whitespace-nowrap transition-colors duration-200">Limpiar</button>
          </div>

          <!-- center area: filters -->
          <div class="flex-1 flex items-center justify-center gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Quick filters for OE and Ne (client-side) -->
              <div class="flex items-center gap-2">
                <label for="oeFilter" class="text-sm text-slate-600">OE</label>
                <div class="relative">
                  <input id="oeFilter" v-model.trim="oeQuery" type="search" placeholder="OE" aria-label="Filtrar por OE"
                    class="px-2 py-1 border border-slate-200 rounded-md text-sm w-24 pr-8" />
                  <button type="button" @click="oeQuery = ''" aria-label="Limpiar OE" v-show="oeQuery"
                    class="custom-clear absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                <label for="neFilter" class="text-sm text-slate-600">Ne</label>
                <div class="relative">
                  <input id="neFilter" v-model.trim="neQuery" type="search" placeholder="Ne" aria-label="Filtrar por Ne"
                    class="px-2 py-1 border border-slate-200 rounded-md text-sm w-20 pr-8" />
                  <button type="button" @click="neQuery = ''" aria-label="Limpiar Ne" v-show="neQuery"
                    class="custom-clear absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- actions: coincidencias + refresh -->
          <div class="flex items-center gap-2">
            <span v-if="(debouncedQ || q) && rows.length >= 0" class="text-sm font-medium text-slate-600"
              aria-live="polite">{{ filteredRows.length }} coincidencias</span>

            <!-- Minimal modern refresh button with icon -->
            <button @click="loadRows" v-tippy="{ content: 'Refrescar datos', placement: 'bottom', theme: 'custom' }"
              class="inline-flex items-center gap-2 px-3 py-1 border border-slate-200 bg-white text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-150">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-3-6.7" stroke-linecap="round" stroke-linejoin="round"></path>
                <polyline points="21 3 21 9 15 9" stroke-linecap="round" stroke-linejoin="round"></polyline>
              </svg>
              <span class="hidden sm:inline">Refrescar</span>
            </button>

            <!-- Export to Excel (CSV) button -->
            <button @click="exportToExcel"
              v-tippy="{ content: 'Exportar a Excel (XLSX)', placement: 'bottom', theme: 'custom' }"
              class="inline-flex items-center gap-2 px-3 py-1 border border-slate-200 bg-white text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors duration-150">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-linecap="round" stroke-linejoin="round">
                </path>
                <polyline points="7 10 12 15 17 10" stroke-linecap="round" stroke-linejoin="round"></polyline>
                <line x1="12" y1="15" x2="12" y2="3" stroke-linecap="round" stroke-linejoin="round"></line>
              </svg>
              <span class="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-sm text-slate-600 py-8 text-center flex-1">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600"></div>
        <p class="mt-2">Cargando...</p>
      </div>

      <div v-else class="flex-1 min-h-0 flex flex-col">
        <div v-if="rows.length === 0" class="text-sm text-slate-600 py-8 text-center">No hay ensayos.</div>

        <div v-else class="flex-1 min-h-0 flex flex-col">
          <div v-if="filteredRows.length === 0"
            class="text-sm text-slate-600 mb-4 py-4 text-center bg-slate-50 rounded-lg flex-shrink-0">
            No hay coincidencias para la búsqueda.
          </div>

          <div class="overflow-auto _minimal-scroll w-full flex-1 min-h-0 rounded-xl border border-slate-200 pb-0">
            <table class="min-w-full w-full table-auto divide-y divide-slate-200 text-xs">
              <colgroup>
                <col style="width:6%" /> <!-- Ensayo -->
                <col style="width:6%" /> <!-- Fecha -->
                <col style="width:12%" /> <!-- OE (doble) -->
                <col style="width:5%" /> <!-- Ne -->
                <col style="width:11%" /> <!-- Titulo -->
                <col style="width:5%" /> <!-- CVm % -->
                <!-- The following columns reduced by 40% (approx): base assumed 5% -> now 3% -->
                <col style="width:3%" /> <!-- Delg -30% -->
                <col style="width:3%" /> <!-- Delg -40% -->
                <col style="width:3%" /> <!-- Delg -50% -->
                <col style="width:3%" /> <!-- Grue +35% -->
                <col style="width:3%" /> <!-- Grue +50% -->
                <col style="width:3%" /> <!-- Neps +140% -->
                <col style="width:3%" /> <!-- Neps +280% -->
                <col style="width:6%" /> <!-- Fuerza B -->
                <col style="width:6%" /> <!-- Elong. % -->
                <col style="width:6%" /> <!-- Tenac. -->
                <col style="width:6%" /> <!-- Trabajo B -->
                <col style="width:6%" /> <!-- Acciones -->
              </colgroup>
              <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-20">
                <tr>
                  <th class="px-2 py-[0.3rem] text-center font-semibold text-slate-700 border-b border-slate-200">Ensayo
                  </th>
                  <th class="px-2 py-[0.3rem] text-center font-semibold text-slate-700 border-b border-slate-200">Fecha
                  </th>
                  <th class="px-2 py-[0.3rem] text-center font-semibold text-slate-700 border-b border-slate-200">OE
                  </th>
                  <th class="px-2 py-[0.3rem] text-center font-semibold text-slate-700 border-b border-slate-200">Ne
                  </th>
                  <th class="px-2 py-[0.3rem] text-center font-semibold text-slate-700 border-b border-slate-200">Titulo
                  </th>
                  <th class="px-2 py-[0.3rem] text-center font-semibold text-slate-700 border-b border-slate-200">CVm %
                  </th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Delg -30%
                  </th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Delg -40%
                  </th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Delg -50%
                  </th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Grue +35%
                  </th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Grue +50%
                  </th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Neps +140%
                  </th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Neps +280%
                  </th>
                  <th class="px-2 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Fuerza B</th>
                  <th class="px-2 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Elong. %</th>
                  <th class="px-2 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Tenac.</th>
                  <th class="px-2 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Trabajo B
                  </th>
                  <th class="px-2 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in pagedRows" :key="idx"
                  class="border-t border-slate-100 hover:bg-blue-50/30 transition-colors duration-150">
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row.Ensayo }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row.Fecha }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row.OE }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row.Ne }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row.Titulo }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['CVm %'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Delg -30%'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Delg -40%'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Delg -50%'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Grue +35%'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Grue +50%'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Neps +140%'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Neps +280%'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Fuerza B'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Elong. %'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Tenac.'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center text-slate-700">{{ row['Trabajo B'] }}</td>
                  <td class="px-2 py-[0.3rem] text-center">
                    <button @click="openDetail(row.Ensayo)"
                      class="inline-flex items-center gap-2 px-2 py-1 border border-slate-200 bg-white text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors duration-150 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-600" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" stroke-linecap="round" stroke-linejoin="round">
                        </path>
                        <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" stroke-linecap="round"
                          stroke-linejoin="round"></path>
                      </svg>
                      <span class="whitespace-nowrap">Ver detalle</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- pagination controls -->
          <div class="flex items-center justify-between mt-3 px-1 flex-shrink-0">
            <div class="text-sm text-slate-600">Mostrando {{ startDisplay }}–{{ endDisplay }} de {{ filteredRows.length
            }}</div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-slate-700">Registros por página:</label>
              <select v-model.number="pageSize"
                class="text-sm px-2 py-1 border border-slate-200 rounded-md text-slate-700 focus:border-blue-400">
                <option v-for="s in [10, 25, 50, 100, 0]" :key="s" :value="s">{{ s === 0 ? 'Todos' : s }}</option>
              </select>

              <!-- first / prev -->
              <button @click="page = 1" :disabled="page <= 1"
                class="px-2 py-1 bg-slate-100 disabled:opacity-50 rounded-md text-sm" title="Primera">« Primera</button>
              <button @click="page = Math.max(1, page - 1)" :disabled="page <= 1"
                class="px-2 py-1 bg-slate-100 disabled:opacity-50 rounded-md text-sm" title="Anterior">‹
                Anterior</button>

              <!-- go to page input -->
              <div class="flex items-center gap-1">
                <label class="sr-only" for="gotoPage">Ir a página</label>
                <input id="gotoPage" type="number" min="1" :max="totalPages" v-model.number.lazy="gotoPage"
                  @keydown.enter.prevent="goToPage()"
                  class="w-20 text-sm px-2 py-1 border border-slate-200 rounded-md text-slate-700 placeholder-slate-400 focus:border-blue-400"
                  placeholder="Página" />
                <button @click="goToPage()" class="px-2 py-1 bg-slate-100 rounded-md text-sm text-slate-700">Ir</button>
              </div>

              <!-- page indicator and next/last -->
              <span class="text-sm text-slate-600">Página {{ page }} / {{ totalPages }}</span>
              <button @click="page = Math.min(totalPages, page + 1)" :disabled="page >= totalPages"
                class="px-2 py-1 bg-slate-100 disabled:opacity-50 rounded-md text-sm" title="Siguiente">Siguiente
                ›</button>
              <button @click="page = totalPages" :disabled="page >= totalPages"
                class="px-2 py-1 bg-slate-100 disabled:opacity-50 rounded-md text-sm" title="Última">Última »</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal detalle con datos raw + estadísticas -->
    <div v-if="modalVisible" class="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog"
      aria-modal="true" aria-labelledby="modalTitle">
      <!-- overlay -->
      <div class="fixed inset-0 bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-sm z-40"
        @click="closeModal" aria-hidden="true"></div>

      <!-- modal content -->
      <div class="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col p-3 z-50 relative"
        role="document">
        <!-- Prev/Next floating buttons glued to modal sides, vertically centered -->
        <button @click="modalPrev" :disabled="modalPrevDisabled" type="button"
          v-tippy="{ content: 'Anterior — Atajo: ← (ArrowLeft). Esc: Cerrar modal', placement: 'left', theme: 'custom' }"
          class="absolute left-0 top-1/2 -translate-y-1/2 -ml-5 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-2xl text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed z-50"
          aria-label="Anterior ensayo">‹</button>

        <button @click="modalNext" :disabled="modalNextDisabled" type="button"
          v-tippy="{ content: 'Siguiente — Atajo: → (ArrowRight). Esc: Cerrar modal', placement: 'right', theme: 'custom' }"
          class="absolute right-0 top-1/2 -translate-y-1/2 -mr-5 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-2xl text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed z-50"
          aria-label="Siguiente ensayo">›</button>

        <header class="flex items-start sm:items-center justify-between mb-2 pb-1 gap-3">
          <div id="modalTitle" class="flex flex-col sm:flex-row sm:items-center gap-2 mx-8">
            <div class="text-slate-600 text-sm">Fecha: <span class="text-slate-900 text-lg font-semibold ml-1">{{
              modalMeta.fechaStr }}</span></div>
            <div class="text-slate-600 text-sm">Ne: <span class="text-slate-900 text-lg font-semibold ml-1">{{
              modalMeta.ne }}</span></div>
            <div class="text-slate-600 text-sm">OE Nro.: <span class="text-slate-900 text-lg font-semibold ml-1">{{
              modalMeta.oe }}</span></div>
            <div class="text-slate-600 text-sm">Ensayo Uster <span class="text-slate-900 text-lg font-semibold ml-1">{{
              modalMeta.u }}</span> y TensoRapid <span class="text-slate-900 text-lg font-semibold ml-1">{{
                  modalMeta.t }}</span></div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Export modal data to Excel (small button to the left of Copy) -->
            <button @click="exportModalToExcel" type="button"
              v-tippy="{ content: 'Exportar este detalle a Excel', placement: 'bottom', theme: 'custom' }"
              class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center text-slate-600 hover:text-slate-700 transition-all duration-200"
              aria-label="Exportar detalle a Excel">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <!-- Copy as image button -->
            <button @click="copyModalAsImage" type="button"
              v-tippy="{ content: 'Copiar como imagen para WhatsApp', placement: 'bottom', theme: 'custom' }"
              class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all duration-200 group"
              aria-label="Copiar como imagen">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>

            <!-- Close button -->
            <button @click="closeModal" type="button"
              v-tippy="{ content: 'Cerrar (Esc)', placement: 'bottom', theme: 'custom' }"
              class="w-9 h-9 rounded-lg bg-white border border-slate-200 hover:border-red-400 hover:bg-red-50 flex items-center justify-center text-slate-600 hover:text-red-600 transition-all duration-200"
              aria-label="Cerrar detalle">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>

        <section class="flex-1 relative">
          <!-- Always render content to preserve modal height; show spinner as overlay when loading -->
          <div>
            <div v-if="mergedRows.length === 0" class="text-sm text-slate-600 py-8 text-center">No hay datos para este
              ensayo.</div>
            <div v-else class="rounded-xl border border-slate-200 overflow-auto modal-scroll max-h-[calc(95vh-4rem)]">
              <table class="min-w-full text-xs">
                <!-- Make the table wrapper the scroll container and use top-0 on thead so
                     the header sticks correctly inside the scrolling area. -->
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-30">
                  <tr>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Huso</th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Titulo</th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">CVm %</th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Delg -30%
                    </th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Delg -40%
                    </th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Delg -50%
                    </th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Grue +35%
                    </th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Grue +50%
                    </th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Neps +140%
                    </th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Neps +280%
                    </th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Fuerza B
                    </th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Elongación
                      %</th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Tenacidad
                    </th>
                    <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200">Trabajo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in mergedRows" :key="idx"
                    :class="['transition-colors duration-150', modalLoading ? 'bg-slate-50/50' : 'hover:bg-slate-50']">
                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-10 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ row.NO }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-32 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.TITULO) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-14 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.CVM_PERCENT) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-16 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.DELG_MINUS30_KM) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-16 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.DELG_MINUS40_KM) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-16 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.DELG_MINUS50_KM) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-16 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.GRUE_35_KM) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-16 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.GRUE_50_KM) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-16 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.NEPS_140_KM) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-16 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.NEPS_280_KM) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-16 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.FUERZA_B) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-14 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.ELONGACION) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-14 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.TENACIDAD) }}</template>
                    </td>

                    <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">
                      <template v-if="modalLoading">
                        <div class="mx-auto w-14 h-4 bg-slate-200/70 rounded animate-pulse"></div>
                      </template>
                      <template v-else>{{ fmtCell(row.TRABAJO) }}</template>
                    </td>
                  </tr>

                  <!-- statistics rows -->
                  <tr class="bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold border-t-2 border-blue-200">
                    <td class="px-3 py-1 text-slate-700">
                      <div class="flex items-center justify-center gap-1">
                        <span>Promedio</span>
                        <button
                          v-tippy="{ content: 'La suma de todos los valores dividida por la cantidad de datos. Representa el valor típico o central de un conjunto de datos.', placement: 'top', theme: 'custom' }"
                          aria-label="Info Promedio"
                          class="inline-flex items-center text-slate-400 hover:text-slate-600">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M12 8h.01" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.avg) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.avg) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.avg) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.avg) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.avg) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.avg) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.avg) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.avg) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.avg) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.avg) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.avg) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.avg) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.avg) }}</td>
                  </tr>

                  <tr class="bg-blue-50/50 font-medium">
                    <td class="px-3 py-1 text-slate-700">
                      <div class="flex items-center justify-center gap-1">
                        <span>CV</span>
                        <button
                          v-tippy="{ content: 'Una medida de dispersión relativa. Un CV del 5% indica baja variabilidad; uno del 50% indica alta dispersión.', placement: 'top', theme: 'custom' }"
                          aria-label="Info CV" class="inline-flex items-center text-slate-400 hover:text-slate-600">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M12 8h.01" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.cv) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.cv) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.cv) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.cv) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.cv) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.cv) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.cv) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.cv) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.cv) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.cv) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.cv) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.cv) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.cv) }}</td>
                  </tr>

                  <tr class="bg-indigo-50/50 font-medium">
                    <td class="px-3 py-1 text-slate-700">
                      <div class="flex items-center justify-center gap-1">
                        <span>s</span>
                        <button
                          v-tippy="{ content: 'Desviación estándar. Mide cuánto se alejan los datos del promedio.', placement: 'top', theme: 'custom' }"
                          aria-label="Info desviación estándar"
                          class="inline-flex items-center text-slate-400 hover:text-slate-600">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M12 8h.01" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.sd) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.sd) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.sd) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.sd) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.sd) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.sd) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.sd) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.sd) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.sd) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.sd) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.sd) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.sd) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.sd) }}</td>
                  </tr>

                  <tr class="bg-blue-50/50 font-medium">
                    <td class="px-3 py-1 text-slate-700">
                      <div class="flex items-center justify-center gap-1">
                        <span>Q95</span>
                        <button
                          v-tippy="{ content: 'Cuantil 95. El valor por debajo del cual se encuentra el 95% de los datos.', placement: 'top', theme: 'custom' }"
                          aria-label="Info Q95" class="inline-flex items-center text-slate-400 hover:text-slate-600">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M12 8h.01" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.q95) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.q95) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.q95) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.q95) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.q95) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.q95) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.q95) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.q95) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.q95) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.q95) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.q95) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.q95) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.q95) }}</td>
                  </tr>

                  <tr class="bg-indigo-50/50 font-medium">
                    <td class="px-3 py-1 text-slate-700">
                      <div class="flex items-center justify-center gap-1">
                        <span>Máx</span>
                        <button
                          v-tippy="{ content: 'Máximo. El valor más alto del conjunto de datos.', placement: 'top', theme: 'custom' }"
                          aria-label="Info Max" class="inline-flex items-center text-slate-400 hover:text-slate-600">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M12 8h.01" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.max) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.max) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.max) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.max) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.max) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.max) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.max) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.max) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.max) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.max) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.max) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.max) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.max) }}</td>
                  </tr>

                  <tr class="bg-blue-50/50 font-medium">
                    <td class="px-3 py-1 text-slate-700">
                      <div class="flex items-center justify-center gap-1">
                        <span>Mín</span>
                        <button
                          v-tippy="{ content: 'Mínimo. El valor más bajo del conjunto de datos.', placement: 'top', theme: 'custom' }"
                          aria-label="Info Min" class="inline-flex items-center text-slate-400 hover:text-slate-600">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M12 8h.01" stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </div>
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.min) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.min) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.min) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.min) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.min) }}
                    </td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.min) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.min) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.min) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.min) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.min) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.min) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.min) }}</td>
                    <td class="px-3 py-1 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.min) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="modalLoading"
            class="absolute inset-0 bg-white/95 z-50 flex flex-col items-center justify-center pointer-events-auto">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600">
            </div>
            <p class="mt-3 text-base text-slate-700 font-medium">Cargando ensayo...</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Swal from 'sweetalert2'
import { toPng } from 'html-to-image'
import ExcelJS from 'exceljs'

const loading = ref(false)
const rows = ref([])

// Search state
const q = ref('')
const debouncedQ = ref('')
const keystrokeTimes = ref([])
const searchTimeout = ref(null)
const debounceDefault = 500
const debounceMsDisplay = ref(debounceDefault)

// Quick client-side filters for OE and Ne
const oeQuery = ref('')
const neQuery = ref('')

// Search fields to check for the general search (always search across these columns)
const allSearchFields = ['Ensayo', 'Fecha', 'OE', 'Ne', 'CVm %', 'Delg -30%', 'Delg -40%', 'Delg -50%', 'Grue +35%', 'Grue +50%', 'Neps +140%', 'Neps +280%', 'Fuerza B', 'Elong. %', 'Tenac.', 'Trabajo B', 'Titulo']
const fieldsToCheck = computed(() => allSearchFields)

// Exact-name numeric columns mapping to avoid heuristic mistakes when coercing
const numericColumnsSet = new Set([
  'CVm %', 'Delg -30%', 'Delg -40%', 'Delg -50%',
  'Grue +35%', 'Grue +50%', 'Neps +140%', 'Neps +280%',
  'Fuerza B', 'Elong. %', 'Tenac.', 'Trabajo B', 'Ne'
])

function onInput() {
  // record keystroke timestamp
  try {
    keystrokeTimes.value.push(Date.now())
    if (keystrokeTimes.value.length > 6) keystrokeTimes.value.shift()
  } catch { /* ignore */ }

  // debounce updating `debouncedQ` using dynamic debounce calculated from typing speed
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
  const ms = Number(debounceMsDisplay.value || debounceDefault)
  searchTimeout.value = setTimeout(() => {
    debouncedQ.value = (q.value || '').toString().trim().toLowerCase()
    searchTimeout.value = null
  }, ms)
}

function clearSearch() {
  q.value = ''
  debouncedQ.value = ''
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
    searchTimeout.value = null
  }
}

const filteredRows = computed(() => {
  const term = (debouncedQ.value || '').toString().trim().toLowerCase()
  const oe = (oeQuery.value || '').toString().trim().toLowerCase()
  const ne = (neQuery.value || '').toString().trim().toLowerCase()

  // If no filters, return all rows
  if (!term && !oe && !ne) return rows.value || []

  const parts = term ? term.split(/\s+/).filter(Boolean) : []

  return (rows.value || []).filter((r) => {
    if (!r) return false

    // Text search across selected fields
    if (parts.length) {
      const textMatch = parts.every((p) => {
        return fieldsToCheck.value.some((field) => {
          const val = r[field]
          if (val == null || val === '') return false
          return String(val).toLowerCase().includes(p)
        })
      })
      if (!textMatch) return false
    }

    // OE filter (client-side): substring match against r.OE
    if (oe) {
      const v = r.OE == null ? '' : String(r.OE).toLowerCase()
      if (!v.includes(oe)) return false
    }

    // Ne filter (client-side): substring match against r.Ne
    if (ne) {
      const v = r.Ne == null ? '' : String(r.Ne).toLowerCase()
      if (!v.includes(ne)) return false
    }

    return true
  })
})

onUnmounted(() => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
})

// Pagination state for large result sets (client-side)
const page = ref(1)
const pageSize = ref(25) // default rows per page

const totalPages = computed(() => {
  if (!filteredRows.value) return 1
  if (pageSize.value === 0) return 1
  return Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value))
})

const pagedRows = computed(() => {
  const list = filteredRows.value || []
  if (pageSize.value === 0) return list
  const start = (page.value - 1) * pageSize.value
  return list.slice(start, start + pageSize.value)
})

const startDisplay = computed(() => {
  const total = filteredRows.value.length || 0
  if (total === 0) return 0
  if (pageSize.value === 0) return 1
  return (page.value - 1) * pageSize.value + 1
})

const endDisplay = computed(() => {
  const total = filteredRows.value.length || 0
  if (total === 0) return 0
  if (pageSize.value === 0) return total
  return Math.min(total, page.value * pageSize.value)
})

watch([filteredRows, pageSize], () => {
  // reset to first page when filter changes or page size changes
  page.value = 1
})

// helper state for go-to-page input
const gotoPage = ref(1)

function goToPage() {
  const p = Number(gotoPage.value) || 1
  if (p < 1) page.value = 1
  else if (p > totalPages.value) page.value = totalPages.value
  else page.value = Math.floor(p)
  // keep the goto input in sync
  gotoPage.value = page.value
}

// keep gotoPage synced when page changes
watch(page, (v) => { gotoPage.value = v })

const backendUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : ''

// Modal state
const modalVisible = ref(false)
const modalLoading = ref(false)
const selectedTestnr = ref(null)
const usterTblRows = ref([])
const tensorTblRows = ref([])
const mergedRows = ref([])
const combinedStats = ref({})
const tensorTestnrs = ref([])

const modalMeta = computed(() => {
  const u = selectedTestnr.value || '—'
  const t = (tensorTestnrs.value && tensorTestnrs.value[0]) || '—'

  // Prefer the main report `rows` for meta (it contains Fecha / OE / Ne). Fallback to USTER or merged rows.
  let meta = (rows.value || []).find(r => String(r?.Ensayo) === String(u)) || null
  if (!meta) meta = (usterTblRows.value && usterTblRows.value[0]) || (mergedRows.value && mergedRows.value[0]) || {}

  const rawFecha = meta?.Fecha || meta?.fecha || meta?.FECHA || meta?.date || ''
  let fechaStr = '—'
  if (rawFecha) {
    const d = new Date(rawFecha)
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yy = String(d.getFullYear()).slice(-2)
      fechaStr = `${dd}/${mm}/${yy}`
    } else {
      // try parse dd/mm/yyyy or dd/mm/yy
      const m = String(rawFecha).match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
      if (m) {
        const dd = String(m[1]).padStart(2, '0')
        const mm = String(m[2]).padStart(2, '0')
        const yy = String(m[3]).length === 4 ? String(m[3]).slice(-2) : String(m[3])
        fechaStr = `${dd}/${mm}/${yy}`
      } else {
        fechaStr = String(rawFecha)
      }
    }
  }

  const oe = meta?.OE ?? meta?.Oe ?? meta?.oe ?? '—'
  const ne = meta?.Ne ?? meta?.NE ?? meta?.ne ?? '—'

  return { fechaStr, oe, ne, u, t }
})

// Index within the current filtered list for the selected ensayo
const modalIndex = computed(() => {
  const u = selectedTestnr.value
  if (u == null) return -1
  const list = filteredRows.value || []
  return list.findIndex(r => String(r?.Ensayo) === String(u))
})

const modalPrevDisabled = computed(() => modalIndex.value <= 0)
const modalNextDisabled = computed(() => {
  const list = filteredRows.value || []
  return modalIndex.value === -1 || modalIndex.value >= list.length - 1
})

function modalPrev() {
  if (modalPrevDisabled.value) return
  const list = filteredRows.value || []
  const prev = list[modalIndex.value - 1]
  const testnr = prev?.Ensayo || prev?.TESTNR || prev?.testnr || prev?.Testnr
  if (testnr != null) openDetail(testnr)
}

function modalNext() {
  if (modalNextDisabled.value) return
  const list = filteredRows.value || []
  const nxt = list[modalIndex.value + 1]
  const testnr = nxt?.Ensayo || nxt?.TESTNR || nxt?.testnr || nxt?.Testnr
  if (testnr != null) openDetail(testnr)
}

// Keyboard shortcuts when modal is open: Left = prev, Right = next, Escape = close
function _handleModalKeydown(e) {
  try {
    if (!modalVisible.value) return
    const active = (typeof window !== 'undefined' && window.document) ? window.document.activeElement?.tagName || '' : ''
    // don't interfere when typing in inputs/selects/textareas
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(String(active).toUpperCase())) return

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      modalPrev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      modalNext()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      closeModal()
    }
  } catch {
    // safe noop on any error
  }
}

onMounted(() => {
  // attach global key listener for modal navigation
  window.addEventListener('keydown', _handleModalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', _handleModalKeydown)
})

// Format stat value (statistics rows)
function fmtStat(v) {
  if (v == null || v === '' || !Number.isFinite(v)) return '-'
  // Eliminar decimales innecesarios: 180.00 → 180, 12.80 → 12.8
  const formatted = v.toFixed(2)
  return parseFloat(formatted).toString()
}

// Format cell value (raw data in modal)
function fmtCell(v) {
  if (v == null || v === '') return '-'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  // Eliminar decimales innecesarios: 180.00 → 180, 12.80 → 12.8
  const formatted = n.toFixed(2)
  return parseFloat(formatted).toString()
}

// Calculate statistics for a column
function calculateStats(values) {
  const nums = values.map(v => Number(v)).filter(n => Number.isFinite(n))
  if (nums.length === 0) return { avg: null, cv: null, sd: null, q95: null, max: null, min: null }

  const avg = nums.reduce((a, b) => a + b, 0) / nums.length
  const variance = nums.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / nums.length
  const sd = Math.sqrt(variance)
  const cv = avg !== 0 ? (sd / avg) * 100 : null

  const sorted = [...nums].sort((a, b) => a - b)
  const q95Index = Math.ceil(sorted.length * 0.95) - 1
  const q95 = sorted[q95Index] || sorted[sorted.length - 1]

  return {
    avg,
    cv,
    sd,
    q95,
    max: Math.max(...nums),
    min: Math.min(...nums)
  }
}

// Parse TITULO string to number (same logic as backend)
function parseTituloToNumber(val) {
  if (val == null) return null
  let s = String(val).trim()
  if (s === '') return null
  let negative = false
  const parMatch = s.match(/^\((.*)\)$/)
  if (parMatch) {
    negative = true
    s = parMatch[1]
  }
  s = s.replace(/[^0-9.,-]/g, '')
  if (s === '' || s === '-' || s === '.' || s === ',') return null
  if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
    s = s.replace(/\./g, '')
    s = s.replace(/,/g, '.')
  } else if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) {
    s = s.replace(/,/g, '.')
  } else {
    s = s.replace(/\.(?=\d{3}(?:\D|$))/g, '')
  }
  s = s.replace(/^\+/, '')
  if (s === '' || s === '-') return null
  const n = Number(s)
  if (!Number.isFinite(n)) return null
  return negative ? -n : n
}

async function openDetail(testnr) {
  selectedTestnr.value = testnr
  modalVisible.value = true
  modalLoading.value = true
  usterTblRows.value = []
  tensorTblRows.value = []
  mergedRows.value = []
  combinedStats.value = {}

  try {
    // Fetch USTER_TBL data
    const usterRes = await fetch(`${backendUrl}/api/uster/tbl?testnr=${encodeURIComponent(testnr)}`)
    if (usterRes.ok) {
      const usterPayload = await usterRes.json()
      usterTblRows.value = Array.isArray(usterPayload.rows) ? usterPayload.rows : []
    }

    // Fetch TENSORAPID_TBL data (via TENSORAPID_PAR linkage)
    const tensorParRes = await fetch(`${backendUrl}/api/tensorapid/by-uster/${encodeURIComponent(testnr)}`)
    if (tensorParRes.ok) {
      const tensorParPayload = await tensorParRes.json()
      const found = (tensorParPayload.rows || []).map(r => r.TESTNR).filter(Boolean)
      tensorTestnrs.value = found

      if (found.length > 0) {
        const tensorTblRes = await fetch(`${backendUrl}/api/tensorapid/tbl?testnr=${encodeURIComponent(found[0])}`)
        if (tensorTblRes.ok) {
          const tensorTblPayload = await tensorTblRes.json()
          tensorTblRows.value = Array.isArray(tensorTblPayload.rows) ? tensorTblPayload.rows : []
        }
      }
    }

    // Combinar filas por NO
    const usterMap = new Map()
    usterTblRows.value.forEach(row => {
      const no = row.NO_ || row.NO
      usterMap.set(no, {
        NO: no,
        TITULO: row.TITULO,
        CVM_PERCENT: fmtCell(row.CVM_PERCENT),
        DELG_MINUS30_KM: fmtCell(row.DELG_MINUS30_KM),
        DELG_MINUS40_KM: fmtCell(row.DELG_MINUS40_KM),
        DELG_MINUS50_KM: fmtCell(row.DELG_MINUS50_KM),
        GRUE_35_KM: fmtCell(row.GRUE_35_KM),
        GRUE_50_KM: fmtCell(row.GRUE_50_KM),
        NEPS_140_KM: fmtCell(row.NEPS_140_KM),
        NEPS_280_KM: fmtCell(row.NEPS_280_KM),
        FUERZA_B: '-',
        ELONGACION: '-',
        TENACIDAD: '-',
        TRABAJO: '-'
      })
    })

    const tensorMap = new Map()
    tensorTblRows.value.forEach(row => {
      const no = row.HUSO_NUMBER || row.NO_ || row.NO
      tensorMap.set(no, {
        FUERZA_B: fmtCell(row.FUERZA_B),
        ELONGACION: fmtCell(row.ELONGACION),
        TENACIDAD: fmtCell(row.TENACIDAD),
        TRABAJO: fmtCell(row.TRABAJO)
      })
    })

    // Combinar: si coinciden por NO, merge en la misma fila
    const allNos = new Set([...usterMap.keys(), ...tensorMap.keys()])
    const merged = []

    allNos.forEach(no => {
      const usterData = usterMap.get(no)
      const tensorData = tensorMap.get(no)

      if (usterData && tensorData) {
        // Ambos existen, combinar
        merged.push({
          ...usterData,
          FUERZA_B: tensorData.FUERZA_B,
          ELONGACION: tensorData.ELONGACION,
          TENACIDAD: tensorData.TENACIDAD,
          TRABAJO: tensorData.TRABAJO
        })
      } else if (usterData) {
        // Solo USTER
        merged.push(usterData)
      } else if (tensorData) {
        // Solo TENSORAPID
        merged.push({
          NO: no,
          TITULO: '-',
          CVM_PERCENT: '-',
          DELG_MINUS30_KM: '-',
          DELG_MINUS40_KM: '-',
          DELG_MINUS50_KM: '-',
          GRUE_35_KM: '-',
          GRUE_50_KM: '-',
          NEPS_140_KM: '-',
          NEPS_280_KM: '-',
          FUERZA_B: tensorData.FUERZA_B,
          ELONGACION: tensorData.ELONGACION,
          TENACIDAD: tensorData.TENACIDAD,
          TRABAJO: tensorData.TRABAJO
        })
      }
    })

    // Ordenar por NO numérico
    merged.sort((a, b) => {
      const aNo = Number(a.NO)
      const bNo = Number(b.NO)
      if (Number.isFinite(aNo) && Number.isFinite(bNo)) return aNo - bNo
      return String(a.NO).localeCompare(String(b.NO))
    })

    mergedRows.value = merged

    // Calcular estadísticas combinadas para cada columna
    const allCols = [
      'TITULO', 'CVM_PERCENT', 'DELG_MINUS30_KM', 'DELG_MINUS40_KM', 'DELG_MINUS50_KM',
      'GRUE_35_KM', 'GRUE_50_KM', 'NEPS_140_KM', 'NEPS_280_KM',
      'FUERZA_B', 'ELONGACION', 'TENACIDAD', 'TRABAJO'
    ]

    combinedStats.value = {}

    allCols.forEach(col => {
      let values = []

      if (col === 'TITULO') {
        // TITULO needs special parsing
        values = usterTblRows.value.map(r => parseTituloToNumber(r.TITULO)).filter(v => v != null)
      } else if (['FUERZA_B', 'ELONGACION', 'TENACIDAD', 'TRABAJO'].includes(col)) {
        // TensoRapid columns
        values = tensorTblRows.value.map(r => r[col]).filter(v => v != null)
      } else {
        // USTER columns
        values = usterTblRows.value.map(r => r[col]).filter(v => v != null)
      }

      combinedStats.value[col] = calculateStats(values)
    })

  } catch (err) {
    console.error('Error loading detail', err)
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el detalle del ensayo.' })
  } finally {
    modalLoading.value = false
  }
}

function closeModal() {
  modalVisible.value = false
  selectedTestnr.value = null
}

async function copyModalAsImage() {

  try {
    // Find the modal content element
    const modalEl = document.querySelector('[role="document"]')
    if (!modalEl) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo encontrar el modal.' })
      return
    }

    // Find and hide prev/next buttons and modal action buttons temporarily
    const prevBtn = document.querySelector('[aria-label="Anterior ensayo"]')
    const nextBtn = document.querySelector('[aria-label="Siguiente ensayo"]')
    const copyBtn = document.querySelector('[aria-label="Copiar como imagen"]')
    const closeBtn = document.querySelector('[aria-label="Cerrar detalle"]')
    const prevBtnDisplay = prevBtn?.style.display
    const nextBtnDisplay = nextBtn?.style.display
    const copyBtnDisplay = copyBtn?.style.display
    const closeBtnDisplay = closeBtn?.style.display
    if (prevBtn) prevBtn.style.display = 'none'
    if (nextBtn) nextBtn.style.display = 'none'
    if (copyBtn) copyBtn.style.display = 'none'
    if (closeBtn) closeBtn.style.display = 'none'

    // Show loading indicator (short)
    Swal.fire({
      title: 'Capturando...',
      allowOutsideClick: false,
      showConfirmButton: false,
      timer: 100,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    // Temporarily suppress console errors for font loading issues
    const originalConsoleError = console.error
    console.error = (...args) => {
      const message = args[0]?.toString() || ''
      // Suppress CORS and CSS rules errors (they don't affect the final image)
      if (message.includes('CSS rules') ||
        message.includes('cssRules') ||
        message.includes('SecurityError')) {
        return
      }
      originalConsoleError.apply(console, args)
    }

    try {
      // Use html-to-image to capture the modal (supports modern CSS)
      // NOTE: skipFonts=true avoids inlining remote stylesheets (cssRules SecurityError)
      const dataUrl = await toPng(modalEl, {
        quality: 0.95, // Slightly lower quality for faster processing
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        cacheBust: true
      })

      // Restore console.error
      console.error = originalConsoleError

      // Restore prev/next and modal action buttons
      if (prevBtn) prevBtn.style.display = prevBtnDisplay || ''
      if (nextBtn) nextBtn.style.display = nextBtnDisplay || ''
      if (copyBtn) copyBtn.style.display = copyBtnDisplay || ''
      if (closeBtn) closeBtn.style.display = closeBtnDisplay || ''

      // Convert data URL to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      try {
        // Try to copy to clipboard
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ])

        Swal.fire({
          icon: 'success',
          title: '¡Copiado!',
          text: 'Pega en WhatsApp: Ctrl+V',
          timer: 1500,
          showConfirmButton: false
        })
      } catch (clipboardErr) {
        console.warn('Clipboard not available, downloading instead:', clipboardErr)

        // Fallback: download the image
        const link = document.createElement('a')
        link.download = `ensayo-${selectedTestnr.value || 'detalle'}.png`
        link.href = dataUrl
        link.click()

        Swal.fire({
          icon: 'success',
          title: 'Descargado',
          text: 'Imagen lista para WhatsApp',
          timer: 1500,
          showConfirmButton: false
        })
      }
    } catch (captureError) {
      // Restore console.error and buttons even if capture fails
      console.error = originalConsoleError
      if (prevBtn) prevBtn.style.display = prevBtnDisplay || ''
      if (nextBtn) nextBtn.style.display = nextBtnDisplay || ''
      if (copyBtn) copyBtn.style.display = copyBtnDisplay || ''
      if (closeBtn) closeBtn.style.display = closeBtnDisplay || ''
      throw captureError
    }
  } catch (err) {
    console.error('Error capturing modal:', err)
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `No se pudo capturar la imagen: ${err.message}`
    })
  }

}

// Export only the currently-open modal's mergedRows to an XLSX file using ExcelJS
async function exportModalToExcel() {
  try {
    const rows = (mergedRows.value || [])
    if (!rows.length) {
      Swal.fire({ icon: 'info', title: 'Nada para exportar', text: 'No hay filas en el detalle del ensayo.' })
      return
    }

    // Visible headers and mapping to object keys used in the modal table
    const headers = ['Fecha', 'Ne', 'OE Nro.', 'Huso', 'Titulo', 'CVm %', 'Delg -30%', 'Delg -40%', 'Delg -50%', 'Grue +35%', 'Grue +50%', 'Neps +140%', 'Neps +280%', 'Fuerza B', 'Elongación %', 'Tenacidad', 'Trabajo']
    const keys = ['NO', 'TITULO', 'CVM_PERCENT', 'DELG_MINUS30_KM', 'DELG_MINUS40_KM', 'DELG_MINUS50_KM', 'GRUE_35_KM', 'GRUE_50_KM', 'NEPS_140_KM', 'NEPS_280_KM', 'FUERZA_B', 'ELONGACION', 'TENACIDAD', 'TRABAJO']

    // find meta info (fecha, ne, oe) from available sources
    const mainMeta = (rows && rows.length && rows[0]) || null
    const rawFecha = mainMeta ? (mainMeta.Fecha || mainMeta.fecha || mainMeta.DATE || null) : null

    // helper to coerce each cell value
    const coerce = (raw) => {
      if (raw == null || raw === '') return ''
      if (typeof raw === 'number') return raw
      const s = String(raw).trim()
      const n = Number(s.replace(/,/g, '.').replace(/[^0-9.+\-eE]/g, ''))
      return Number.isFinite(n) ? n : s
    }

    // Build body rows with Fecha, Ne, OE Nro. prefixed
    const bodyRows = rows.map(r => {
      const metaFechaRaw = (r && (r.Fecha || r.fecha)) || rawFecha || null
      const rowVals = []
      rowVals.push(metaFechaRaw || '')
      rowVals.push(modalMeta.value.ne || '')
      rowVals.push(modalMeta.value.oe || '')
      // Huso (NO)
      rowVals.push(coerce(r.NO))
      // remaining keys (skip NO)
      keys.forEach(k => {
        if (k === 'NO') return
        const raw = r?.[k]
        rowVals.push(coerce(raw))
      })
      return rowVals
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'carga-datos-vue'
    workbook.created = new Date()
    const sheet = workbook.addWorksheet('Detalle')

    // Freeze like C2 for modal export as well (optional but consistent)
    try { sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 1, topLeftCell: 'C2', activeCell: 'C2' }] } catch { /* ignore */ }

    sheet.addRow(headers)
    bodyRows.forEach(r => sheet.addRow(r))
    sheet.columns = headers.map(h => ({ header: h, width: Math.max(8, String(h).length + 6) }))

    // Header styling
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } }
    })

    const lastRowNumber = bodyRows.length + 1
    const lastColNumber = headers.length
    try { sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: lastRowNumber, column: lastColNumber } } } catch { /* ignore */ }

    for (let rn = 2; rn <= lastRowNumber; rn++) {
      const row = sheet.getRow(rn)
      const isEven = (rn % 2) === 0
      row.eachCell(cell => {
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        if (isEven) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFF' } }
      })
    }
    // Ensure Fecha column values are actual Date objects in Excel (col 1)
    const fechaIdx = headers.findIndex(h => String(h).toLowerCase().includes('fecha'))
    if (fechaIdx !== -1) {
      const col = sheet.getColumn(fechaIdx + 1)
      col.numFmt = 'dd/mm/yyyy'
      // parse cell strings like dd/mm/yyyy into Date
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        const cell = row.getCell(fechaIdx + 1)
        const v = cell.value
        if (v == null || v === '') return
        if (v instanceof Date) return
        // try parse dd/mm/yyyy or ISO
        const s = String(v).trim()
        const m = s.match(/^([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{2,4})$/)
        if (m) {
          let d = parseInt(m[1], 10)
          let mo = parseInt(m[2], 10)
          let y = parseInt(m[3], 10)
          if (y < 100) y += y >= 70 ? 1900 : 2000
          const dt = new Date(y, mo - 1, d)
          if (!isNaN(dt.getTime())) cell.value = dt
        } else {
          const dt = new Date(s)
          if (!isNaN(dt.getTime())) cell.value = dt
        }
      })
    }

    // Append statistics section below the data (if available). Each stats row repeats Fecha, Ne, OE Nro. in first 3 columns
    try {
      const stats = combinedStats.value || {}
      const metricCols = ['TITULO', 'CVM_PERCENT', 'DELG_MINUS30_KM', 'DELG_MINUS40_KM', 'DELG_MINUS50_KM', 'GRUE_35_KM', 'GRUE_50_KM', 'NEPS_140_KM', 'NEPS_280_KM', 'FUERZA_B', 'ELONGACION', 'TENACIDAD', 'TRABAJO']
      // blank row separator and title
      sheet.addRow([])
      sheet.addRow(['Estadísticas'])

      const statLabels = [
        { key: 'avg', label: 'Promedio' },
        { key: 'cv', label: 'CV' },
        { key: 'sd', label: 's' },
        { key: 'q95', label: 'Q95' },
        { key: 'max', label: 'Máx' },
        { key: 'min', label: 'Mín' }
      ]

      // for each stat label, add a row with Fecha, Ne, OE, Label, then values per metricCols
      statLabels.forEach(sl => {
        const rowVals = []
        // use first data row's date if available, else modalMeta
        const firstDataFecha = bodyRows.length ? bodyRows[0][0] : null
        rowVals.push(firstDataFecha || modalMeta.value.fechaStr || '')
        rowVals.push(modalMeta.value.ne || '')
        rowVals.push(modalMeta.value.oe || '')
        rowVals.push(sl.label)
        metricCols.forEach(metric => {
          const s = stats[metric] || {}
          const v = s[sl.key]
          if (v == null) rowVals.push('')
          else if (typeof v === 'number') rowVals.push(Number(v.toFixed(2)))
          else rowVals.push(v)
        })
        const r = sheet.addRow(rowVals)
        r.eachCell(cell => { cell.alignment = { horizontal: 'center' } })
      })
    } catch {
      // non-fatal
    }

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    link.href = url
    link.setAttribute('download', `detalle-ensayo-${modalMeta.value.u || 'ensayo'}-${ts}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    Swal.fire({ icon: 'success', title: 'Exportado', text: 'Detalle exportado a XLSX.', timer: 1200, showConfirmButton: false })
  } catch (err) {
    console.error('Error exportando detalle a XLSX', err)
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo exportar el detalle.' })
  }
}

async function loadRows() {
  loading.value = true
  try {
    const res = await fetch(`${backendUrl}/api/report/informe-completo`)
    if (!res.ok) throw new Error(await res.text())
    const payload = await res.json()
    rows.value = Array.isArray(payload.rows) ? payload.rows : []
  } catch (err) {
    console.error('Failed to load rows', err)
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar el informe completo.' })
  } finally {
    loading.value = false
  }
}

async function exportToExcel() {
  try {
    const rowsToExport = filteredRows.value || []
    if (!rowsToExport.length) {
      Swal.fire({ icon: 'info', title: 'Nada para exportar', text: 'No hay filas que coincidan con los filtros.' })
      return
    }

    const headers = fieldsToCheck.value || []

    // Build rows and coerce types similar to before
    function parseDateSmart(value) {
      if (value == null || value === '') return null
      if (value instanceof Date) return value
      const s = String(value).trim()
      if (!s) return null
      let d = new Date(s)
      if (!isNaN(d.getTime())) return d
      const m = s.match(new RegExp('^([0-9]{1,2})[-/.]([0-9]{1,2})[-/.]([0-9]{2,4})$'))
      if (m) {
        const a = parseInt(m[1], 10)
        const b = parseInt(m[2], 10)
        let y = parseInt(m[3], 10)
        if (y < 100) y += y >= 70 ? 1900 : 2000
        const tryDayFirst = new Date(y, b - 1, a)
        const tryMonthFirst = new Date(y, a - 1, b)
        const now = new Date()
        const plausible = dt => {
          if (isNaN(dt.getTime())) return false
          const yr = dt.getFullYear()
          return yr >= 1900 && yr <= now.getFullYear() + 1
        }
        if (a > 12 && plausible(tryDayFirst)) return tryDayFirst
        if (b > 12 && plausible(tryMonthFirst)) return tryMonthFirst
        if (plausible(tryDayFirst)) return tryDayFirst
        if (plausible(tryMonthFirst)) return tryMonthFirst
      }
      return null
    }

    const bodyRows = rowsToExport.map(r => {
      return headers.map(h => {
        const raw = r[h] == null ? '' : r[h]
        const key = String(h).toLowerCase()
        if (key === 'ensayo') {
          const n = Number(String(raw).toString().replace(/[^0-9-]+/g, ''))
          return Number.isFinite(n) ? n : raw
        }
        if (key === 'fecha') {
          const pd = parseDateSmart(raw)
          return pd || raw
        }
        if (numericColumnsSet.has(h)) {
          if (raw === '' || raw == null) return ''
          if (typeof raw === 'number') return raw
          const n = Number(String(raw).toString().replace(/,/g, '.').replace(/[^0-9.-]+/g, ''))
          return Number.isNaN(n) ? raw : n
        }
        if (key === 'titulo') {
          const parsed = parseTituloToNumber(raw)
          return parsed == null ? raw : parsed
        }
        return raw
      })
    })

    // Create workbook with ExcelJS to enable real table + styles
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'carga-datos-vue'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Resumen')

    // Fijar paneles como si el usuario hubiera seleccionado la celda C2 (columnas A-B
    // a la izquierda y la fila 1 arriba quedan fijas). Esto mantiene la cabecera
    // visible al desplazarse.
    try {
      sheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 1, topLeftCell: 'C2', activeCell: 'C2' }]
    } catch (e) {
      console.warn('No se pudo fijar paneles en la hoja Excel (sheet.views):', e)
    }

    // Add header row
    sheet.addRow(headers)

    // Add data rows
    bodyRows.forEach(r => sheet.addRow(r))

    // Set column widths (based on header lengths)
    sheet.columns = headers.map(h => ({ header: h, width: Math.max(10, String(h).length + 8) }))

    // Instead of creating a native Excel "table" (which in some Excel versions
    // produced table XML that was later stripped), add a styled header row,
    // banded rows, center alignment and an explicit autofilter range. This avoids
    // problematic table XML while keeping the UX (filters + banding).
    const totalRows = bodyRows.length
    const lastRowNumber = totalRows + 1 // header + data rows
    const lastColNumber = headers.length

    // Style header row
    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
    headerRow.height = 20
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6366F1' } } // indigo-500-ish
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } }
    })

    // Apply autofilter from header to last data row
    try {
      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: lastRowNumber, column: lastColNumber } }
    } catch (e) {
      // Some older ExcelJS consumers may not support complex autofilter objects;
      // ignore if setting fails but keep export successful.
      console.warn('Could not set autofilter on worksheet:', e)
    }

    // Banded rows + center alignment
    for (let rn = 2; rn <= lastRowNumber; rn++) {
      const row = sheet.getRow(rn)
      const isEven = (rn % 2) === 0
      row.eachCell(cell => {
        // center content horizontally + vertically
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
        // subtle banded background for even rows
        if (isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFF' } }
        }
      })
    }

    // Ensure Fecha column type and format
    const fechaIdx = headers.findIndex(h => String(h).toLowerCase() === 'fecha')
    if (fechaIdx !== -1) {
      sheet.getColumn(fechaIdx + 1).numFmt = 'dd/mm/yyyy'
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        const cell = row.getCell(fechaIdx + 1)
        if (cell && typeof cell.value === 'string') {
          const pd = parseDateSmart(cell.value)
          if (pd) cell.value = pd
        }
      })
    }

    // Ensure Ensayo column numeric
    const ensayoIdx = headers.findIndex(h => String(h).toLowerCase() === 'ensayo')
    if (ensayoIdx !== -1) {
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        const cell = row.getCell(ensayoIdx + 1)
        if (cell && typeof cell.value === 'string') {
          const n = Number(String(cell.value).replace(/[^0-9-]+/g, ''))
          if (Number.isFinite(n)) cell.value = n
        }
      })
    }

    // Generate buffer and trigger download
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const now = new Date()
    const pad = n => String(n).padStart(2, '0')
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    link.href = url
    link.setAttribute('download', `resumen-ensayos-${ts}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    Swal.fire({ icon: 'success', title: 'Exportado', text: 'Archivo XLSX listo para abrir en Excel.', timer: 1400, showConfirmButton: false })
  } catch (err) {
    console.error('Error exporting XLSX (ExcelJS)', err)
    Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo exportar a XLSX.' })
  }
}

onMounted(() => {
  loadRows()
})
</script>

<style scoped>
/* Minimal modern scrollbar for the modal table wrapper only (Firefox + WebKit) */
.modal-scroll {
  /* Firefox */
  scrollbar-width: thin;
  /* thumb then track */
  scrollbar-color: rgba(99, 102, 241, 0.35) transparent;
}

.modal-scroll::-webkit-scrollbar {
  width: 8px;
}

.modal-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.modal-scroll::-webkit-scrollbar-thumb {
  background: rgba(99, 102, 241, 0.35);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.14);
  transition: background 160ms linear, box-shadow 160ms linear;
}

.modal-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(99, 102, 241, 0.65);
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.24);
}

.modal-scroll::-webkit-scrollbar-thumb:active {
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.28);
}

/* Hide native clear/cancel icons for search inputs to avoid duplicate X buttons */
input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button,
input[type="search"]::-webkit-search-results-button,
input[type="search"]::-webkit-search-results-decoration {
  -webkit-appearance: none;
}

/* IE/Edge clear */
input[type="search"]::-ms-clear,
input[type="search"]::-ms-reveal {
  display: none;
  width: 0;
  height: 0;
}

/* Custom clear button small hit target adjustments */
.custom-clear {
  width: 1.5rem;
  height: 1.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
