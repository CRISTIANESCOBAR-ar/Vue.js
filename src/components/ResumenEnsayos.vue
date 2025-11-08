<template>
  <div class="w-full pt-1 px-1">
    <main class="w-full bg-white rounded-2xl shadow-xl px-4 py-3 border border-slate-200">
      <div class="flex flex-col gap-2 mb-3">
        <!-- Single top row: title, search, filters (center), refresh -->
        <div class="flex items-center gap-2">
          <h3 class="text-xl font-semibold text-slate-800 whitespace-nowrap">Informe Completo de Ensayos</h3>

          <!-- center area: search + filters -->
          <div class="flex-1 flex items-center justify-center gap-2">
            <div class="flex items-center gap-2 w-full max-w-sm">
              <label for="searchInput" class="sr-only">Buscar ensayos</label>
              <input id="searchInput" v-model="q" @input="onInput" type="search"
                placeholder="Buscar por Ensayo, Fecha, OE, Ne..." aria-label="Buscar ensayos"
                class="px-3 py-1.5 border border-slate-300 rounded-md w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
              <button v-if="q" @click="clearSearch" title="Limpiar"
                class="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-sm whitespace-nowrap transition-colors duration-200">Limpiar</button>
            </div>

            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-slate-600">Buscar en:</span>
              <label class="inline-flex items-center text-sm cursor-pointer">
                <input type="radio" name="searchField" class="mr-1 text-blue-600 focus:ring-blue-500"
                  v-model="searchField" value="ALL" />
                <span class="text-slate-700">Todos</span>
              </label>
              <label class="inline-flex items-center text-sm cursor-pointer">
                <input type="radio" name="searchField" class="mr-1 text-blue-600 focus:ring-blue-500"
                  v-model="searchField" value="OE" />
                <span class="text-slate-700">OE</span>
              </label>
              <label class="inline-flex items-center text-sm cursor-pointer">
                <input type="radio" name="searchField" class="mr-1 text-blue-600 focus:ring-blue-500"
                  v-model="searchField" value="Ne" />
                <span class="text-slate-700">Ne</span>
              </label>
              <!-- Quick filters for OE and Ne (client-side) -->
              <div class="flex items-center gap-2 ml-2">
                <label class="sr-only" for="oeFilter">OE</label>
                <input id="oeFilter" v-model.trim="oeQuery" type="search" placeholder="OE"
                  v-tippy="{ content: 'Filtrar por OE', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                  aria-label="Filtrar por OE" class="px-2 py-1 border border-slate-200 rounded-md text-sm w-24" />
                <label class="sr-only" for="neFilter">Ne</label>
                <input id="neFilter" v-model.trim="neQuery" type="search" placeholder="Ne"
                  v-tippy="{ content: 'Filtrar por título', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                  aria-label="Filtrar por título" class="px-2 py-1 border border-slate-200 rounded-md text-sm w-20" />
              </div>
            </div>
          </div>

          <!-- actions: coincidencias + refresh -->
          <div class="flex items-center gap-2">
            <span v-if="(debouncedQ || q) && rows.length >= 0" class="text-sm font-medium text-slate-600"
              aria-live="polite">{{ filteredRows.length }} coincidencias</span>
            <button @click="loadRows"
              class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md">Refrescar</button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="text-sm text-slate-600 py-8 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600"></div>
        <p class="mt-2">Cargando...</p>
      </div>

      <div v-else>
        <div v-if="rows.length === 0" class="text-sm text-slate-600 py-8 text-center">No hay ensayos.</div>

        <div v-else>
          <div v-if="filteredRows.length === 0"
            class="text-sm text-slate-600 mb-4 py-4 text-center bg-slate-50 rounded-lg">
            No hay coincidencias para la búsqueda.
          </div>

          <div
            class="overflow-auto _minimal-scroll w-full max-h-[calc(100vh-5rem)] rounded-xl border border-slate-200 pb-0">
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
                      class="px-2 py-1 bg-blue-600 text-white rounded-md text-xs font-medium whitespace-nowrap hover:bg-blue-700 transition-colors duration-150">Ver
                      detalle</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <!-- pagination controls -->
          <div class="flex items-center justify-between mt-3 px-1">
            <div class="text-sm text-slate-600">Mostrando {{ startDisplay }}–{{ endDisplay }} de {{ filteredRows.length
            }}</div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-slate-600">Filas:</label>
              <select v-model.number="pageSize" class="text-sm px-2 py-1 border rounded-md">
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
                  @keydown.enter.prevent="goToPage()" class="w-20 text-sm px-2 py-1 border rounded-md"
                  placeholder="Página" />
                <button @click="goToPage()" class="px-2 py-1 bg-slate-100 rounded-md text-sm">Ir</button>
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
        <!-- Prev / Next navigation buttons (absolute, overlay) -->
        <button v-if="modalVisible" @click="goPrev()" :disabled="!hasPrev || modalLoading"
          class="modal-nav-btn left-btn" aria-label="Ensayo anterior" title="Ensayo anterior">
          <span aria-hidden="true">‹</span>
        </button>
        <button v-if="modalVisible" @click="goNext()" :disabled="!hasNext || modalLoading"
          class="modal-nav-btn right-btn" aria-label="Siguiente ensayo" title="Siguiente ensayo">
          <span aria-hidden="true">›</span>
        </button>
        <header class="flex items-center justify-between mb-2 pb-1">
          <div id="modalTitle" class="flex-1 text-sm text-slate-500 truncate flex items-center flex-wrap gap-2">
            <span class="mr-3 flex items-baseline gap-1">
              <span class="text-sm text-slate-500">Fecha:</span>
              <span class="text-slate-900 font-semibold text-base md:text-lg">{{ modalMeta.fechaStr }}</span>
            </span>
            <span class="mr-3 flex items-baseline gap-1">
              <span class="text-sm text-slate-500">OE Nro.:</span>
              <span class="text-slate-900 font-semibold text-base md:text-lg">{{ modalMeta.oe }}</span>
            </span>
            <span class="mr-3 flex items-baseline gap-1">
              <span class="text-sm text-slate-500">Ne:</span>
              <span class="text-slate-900 font-semibold text-base md:text-lg">{{ modalMeta.ne }}</span>
            </span>
            <span class="mr-3 flex items-baseline gap-1">
              <span class="text-sm text-slate-500">Ensayo Uster</span>
              <span class="text-slate-900 font-medium text-sm">{{ modalMeta.u }}</span>
            </span>
            <span class="flex items-baseline gap-1">
              <span class="text-sm text-slate-500">TensoRapid</span>
              <span class="text-slate-900 font-medium text-sm">{{ modalMeta.t }}</span>
            </span>
          </div>
          <button @click="closeModal"
            class="px-4 py-[0.4rem] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 font-medium"
            aria-label="Cerrar detalle">Cerrar</button>
        </header>

        <section class="flex-1 modal-body">
          <div v-if="modalLoading" class="text-sm text-slate-600 py-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600">
            </div>
            <p class="mt-2">Cargando detalles...</p>
          </div>

          <div v-else>
            <!-- keep table mounted; show overlay spinner while loading to avoid content disappearing -->
            <section class="flex-1 relative">
              <div ref="modalContent"
                :class="['rounded-xl border border-slate-200 overflow-auto modal-scroll max-h-[calc(95vh-4rem)]', { 'fade-switch': switching }]">
                <table class="min-w-full text-xs">
                  <!-- Make the table wrapper the scroll container and use top-0 on thead so
                     the header sticks correctly inside the scrolling area. -->
                  <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-30">
                    <tr>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Huso</span>
                        <button
                          v-tippy="{ content: 'Número de huso o posición dentro del ensayo.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Huso" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Titulo</span>
                        <button
                          v-tippy="{ content: 'Valor de título del muestreo (parseado en número cuando aplica).', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Título" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>CVm %</span>
                        <button
                          v-tippy="{ content: 'Coeficiente de variación (%) para este conjunto de medidas.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de CVm" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Delg -30%</span>
                        <button
                          v-tippy="{ content: 'Delg -30%: delgadez medida bajo condición -30%.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Delg -30%" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Delg -40%</span>
                        <button
                          v-tippy="{ content: 'Delg -40%: delgadez medida bajo condición -40%.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Delg -40%" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Delg -50%</span>
                        <button
                          v-tippy="{ content: 'Delg -50%: delgadez medida bajo condición -50%.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Delg -50%" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Grue +35%</span>
                        <button
                          v-tippy="{ content: 'Grueso bajo condición +35%.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Grue +35%" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Grue +50%</span>
                        <button
                          v-tippy="{ content: 'Grueso bajo condición +50%.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Grue +50%" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Neps +140%</span>
                        <button
                          v-tippy="{ content: 'Neps +140%: neps bajo ampliación 140%.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Neps +140%" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Neps +280%</span>
                        <button
                          v-tippy="{ content: 'Neps +280%: neps bajo ampliación 280%.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Neps +280%" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Fuerza B</span>
                        <button
                          v-tippy="{ content: 'Fuerza B: fuerza medida en banco B.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Fuerza B" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Elong. %</span>
                        <button
                          v-tippy="{ content: 'Elongación porcentual medida en ensayo.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Elongación" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Tenac.</span>
                        <button
                          v-tippy="{ content: 'Tenacidad del material medida en el ensayo.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Tenacidad" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                      <th class="px-3 py-2 text-center font-semibold text-slate-700 border-b border-slate-200 th-help">
                        <span>Trabajo B</span>
                        <button
                          v-tippy="{ content: 'Trabajo B: trabajo mecánico en banco B.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                          type="button" aria-label="Definición de Trabajo B" class="help-btn">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            stroke-width="1.5" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                            <path
                              d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                              stroke-linecap="round" stroke-linejoin="round" />
                          </svg>
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in mergedRows" :key="idx"
                      class="hover:bg-slate-50 transition-colors duration-150">
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{ row.NO }}</td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{ fmtCell(row.TITULO)
                        }}</td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.CVM_PERCENT) }}
                      </td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.DELG_MINUS30_KM)
                        }}</td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.DELG_MINUS40_KM)
                        }}</td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.DELG_MINUS50_KM)
                        }}</td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.GRUE_35_KM) }}
                      </td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.GRUE_50_KM) }}
                      </td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.NEPS_140_KM) }}
                      </td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.NEPS_280_KM) }}
                      </td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.FUERZA_B) }}</td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.ELONGACION) }}
                      </td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{
                        fmtCell(row.TENACIDAD) }}
                      </td>
                      <td class="px-3 py-1 text-center border-b border-slate-100 text-slate-700">{{ fmtCell(row.TRABAJO)
                        }}</td>
                    </tr>

                    <!-- statistics rows -->
                    <tr class="bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold border-t-2 border-blue-200">
                      <td class="px-3 py-1 text-slate-700">
                        <div class="inline-flex items-center gap-1 whitespace-nowrap">
                          <span class="font-semibold">Promedio</span>
                          <button
                            v-tippy="{ content: 'Es la media aritmética o promedio de los datos. Indica el valor central.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                            type="button" aria-label="Definición de Promedio"
                            class="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-transparent hover:bg-slate-100 text-slate-700 focus:outline-none p-0 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-3 h-3" fill="none"
                              stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                              <path
                                d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                                stroke-linecap="round" stroke-linejoin="round" />
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
                        <div class="inline-flex items-center gap-1 whitespace-nowrap">
                          <span class="font-semibold">CV</span>
                          <button
                            v-tippy="{ content: 'Es el coeficiente de variación (%), que mide la dispersión relativa respecto a la media. Un CV bajo indica poca variabilidad.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                            type="button" aria-label="Definición de CV"
                            class="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-transparent hover:bg-slate-100 text-slate-700 focus:outline-none p-0 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-3 h-3" fill="none"
                              stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                              <path
                                d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                                stroke-linecap="round" stroke-linejoin="round" />
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
                        <div class="inline-flex items-center gap-1 whitespace-nowrap">
                          <span class="font-semibold">s</span>
                          <button
                            v-tippy="{ content: 'Desviación estándar (s): medida de dispersión absoluta. Indica cuánto varían los datos respecto a la media.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                            type="button" aria-label="Definición de s"
                            class="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-transparent hover:bg-slate-100 text-slate-700 focus:outline-none p-0 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-3 h-3" fill="none"
                              stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                              <path
                                d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                                stroke-linecap="round" stroke-linejoin="round" />
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
                        <div class="inline-flex items-center gap-1 whitespace-nowrap">
                          <span class="font-semibold">Q95</span>
                          <button
                            v-tippy="{ content: 'Percentil 95 (Q95): valor por debajo del cual se encuentra el 95% de los datos.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                            type="button" aria-label="Definición de Q95"
                            class="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-transparent hover:bg-slate-100 text-slate-700 focus:outline-none p-0 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-3 h-3" fill="none"
                              stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                              <path
                                d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                                stroke-linecap="round" stroke-linejoin="round" />
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
                        <div class="inline-flex items-center gap-1 whitespace-nowrap">
                          <span class="font-semibold">Máx</span>
                          <button
                            v-tippy="{ content: 'Máx: valor máximo observado en los datos.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                            type="button" aria-label="Definición de Máx"
                            class="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-transparent hover:bg-slate-100 text-slate-700 focus:outline-none p-0 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-3 h-3" fill="none"
                              stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                              <path
                                d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                                stroke-linecap="round" stroke-linejoin="round" />
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
                        <div class="inline-flex items-center gap-1 whitespace-nowrap">
                          <span class="font-semibold">Mín</span>
                          <button
                            v-tippy="{ content: 'Mín: valor mínimo observado en los datos.', placement: 'bottom', theme: 'custom', delay: [100, 0], offset: [0, 6] }"
                            type="button" aria-label="Definición de Mín"
                            class="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs bg-transparent hover:bg-slate-100 text-slate-700 focus:outline-none p-0 flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="w-3 h-3" fill="none"
                              stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8.5v.01" stroke-linecap="round" stroke-linejoin="round" />
                              <path
                                d="M11.2 13.2c.2-.6.6-1 1.6-1 .9 0 1.2.4 1.2 1.1 0 .9-.6 1.1-1.4 1.4-.9.3-1.1.6-1.1 1.1"
                                stroke-linecap="round" stroke-linejoin="round" />
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

              <!-- spinner overlay while modalLoading: keep existing content visible underneath -->
              <div v-if="modalLoading" class="absolute inset-0 z-40 flex items-center justify-center bg-white/60">
                <div
                  class="inline-block animate-spin rounded-full h-10 w-10 border-4 border-slate-300 border-t-blue-600">
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import Swal from 'sweetalert2'

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

// Search field selection: 'ALL' | 'OE' | 'Ne'
const searchField = ref('ALL')
const allSearchFields = ['Ensayo', 'Fecha', 'OE', 'Ne', 'CVm %', 'Delg -30%', 'Delg -40%', 'Delg -50%', 'Grue +35%', 'Grue +50%', 'Neps +140%', 'Neps +280%', 'Fuerza B', 'Elong. %', 'Tenac.', 'Trabajo B', 'Titulo']

const fieldsToCheck = computed(() => {
  switch (searchField.value) {
    case 'OE': return ['OE']
    case 'Ne': return ['Ne']
    default: return allSearchFields
  }
})

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
const switching = ref(false)
const modalContent = ref(null)
let _switchTimeout = null

const modalMeta = computed(() => {
  const u = selectedTestnr.value || '—'
  const t = (tensorTestnrs.value && tensorTestnrs.value[0]) || '—'
  // look up the row in the main list to extract Fecha, OE, Ne, Titulo
  const found = (rows.value || []).find(r => String(r.Ensayo) === String(u)) || {}
  const rawFecha = found.Fecha || found.fecha || ''
  // helper: normalize various date formats into dd/mm/yy (force day/month order)
  function formatToDDMMYY(input) {
    if (!input && input !== 0) return '—'
    // If it's already a Date
    if (input instanceof Date && !isNaN(input.getTime())) {
      const d = input
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yy = String(d.getFullYear()).slice(-2)
      return `${dd}/${mm}/${yy}`
    }
    const s = String(input).trim()
    if (!s) return '—'

    // ISO-like yyyy-mm-dd or yyyy/mm/dd
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
    if (m) {
      const yyyy = m[1]
      const mm = String(m[2]).padStart(2, '0')
      const dd = String(m[3]).padStart(2, '0')
      return `${dd}/${mm}/${String(yyyy).slice(-2)}`
    }

    // Common form like dd/mm/yyyy or mm/dd/yyyy -> prefer dd/mm/yyyy (force day first)
    m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/)
    if (m) {
      const part1 = String(m[1]).padStart(2, '0') // treat as day
      const part2 = String(m[2]).padStart(2, '0') // treat as month
      const part3 = String(m[3])
      const yy = part3.length === 4 ? part3.slice(-2) : part3
      return `${part1}/${part2}/${yy}`
    }

    // Fallback: try Date parse and format
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yy = String(d.getFullYear()).slice(-2)
      return `${dd}/${mm}/${yy}`
    }

    // Last resort: return original string
    return s
  }

  const fechaStr = rawFecha ? formatToDDMMYY(rawFecha) : '—'

  const oe = found.OE || found.Oe || '—'
  const ne = found.Ne || found.NE || found.ne || '—'
  const titulo = found.Titulo || found.titulo || found.Title || '—'

  return { u, t, fechaStr, oe, ne, titulo }
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
  // keep previous mergedRows visible while loading new data to avoid flash
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

onMounted(() => {
  loadRows()
})

// Modal navigation: previous / next within the current filtered results (filteredRows)
const currentIndex = computed(() => {
  if (!selectedTestnr.value) return -1
  return (filteredRows.value || []).findIndex(r => String(r.Ensayo) === String(selectedTestnr.value))
})

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value > -1 && currentIndex.value < (filteredRows.value || []).length - 1)

function goPrev() {
  if (!hasPrev.value) return
  const idx = currentIndex.value - 1
  const nextTest = filteredRows.value[idx] && filteredRows.value[idx].Ensayo
  if (nextTest) openDetail(nextTest)
}

function goNext() {
  if (!hasNext.value) return
  const idx = currentIndex.value + 1
  const nextTest = filteredRows.value[idx] && filteredRows.value[idx].Ensayo
  if (nextTest) openDetail(nextTest)
}

// Keyboard navigation while modal is open
function handleKeydown(e) {
  if (!modalVisible.value) return
  if (modalLoading.value) return
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    goPrev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    goNext()
  }
}

// animate a small fade when selectedTestnr changes (keeps DOM mounted)
watch(selectedTestnr, async (nv) => {
  if (!nv) return
  // pin current height to avoid any layout shrink during the transition
  await nextTick()
  const el = modalContent.value
  if (el && el.nodeType === 1) {
    try {
      // store current height and apply as minHeight
      const h = el.clientHeight
      el.style.minHeight = h + 'px'
    } catch { /* ignore */ }
  }

  switching.value = true
  if (_switchTimeout) clearTimeout(_switchTimeout)
  _switchTimeout = setTimeout(() => {
    if (el && el.nodeType === 1) el.style.minHeight = ''
    switching.value = false
    _switchTimeout = null
  }, 320)
})

// Add/remove keydown listener when modal opens/closes
watch(modalVisible, (val) => {
  if (val) window.addEventListener('keydown', handleKeydown)
  else window.removeEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // ensure listener removed
  try { window.removeEventListener('keydown', handleKeydown) } catch { /* ignore */ }
  if (_switchTimeout) clearTimeout(_switchTimeout)
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

.modal-nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 60;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: white;
  box-shadow: 0 6px 20px rgba(2, 6, 23, 0.08);
  border: 1px solid rgba(15, 23, 42, 0.06);
  color: #0f172a;
  /* slate-900 */
  font-size: 1.25rem;
  cursor: pointer;
}

.modal-nav-btn[disabled] {
  opacity: 0.45;
  cursor: default;
}

.modal-nav-btn.left-btn {
  left: -1rem;
}

.modal-nav-btn.right-btn {
  right: -1rem;
}

/* Compact help icon inside table headers without affecting layout width */
.th-help {
  position: relative;
  /* leave a bit of space on the right so the absolute icon doesn't overlap text */
  padding-right: 1.25rem;
}

.th-help .help-btn {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  border: none;
  color: #334155;
  /* slate-700 */
}

.th-help .help-btn svg {
  width: 0.75rem;
  height: 0.75rem;
}

/* Fade transition for modal detail changes (smooth switch when changing ensayo) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 160ms ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0.06;
  /* almost invisible, but keeps position */
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}

/* short switch animation (applied via .fade-switch class) - opacity only to avoid vertical shifts */
.fade-switch {
  will-change: opacity;
  animation: fadeSwitch 220ms ease;
}

@keyframes fadeSwitch {
  from {
    opacity: 0.22;
  }

  to {
    opacity: 1;
  }
}

/* Ensure modal body keeps a minimum height to avoid layout jumps when content varies */
.modal-body {
  min-height: 420px;
}

@media (max-width: 640px) {
  .modal-body {
    min-height: 300px;
  }
}
</style>
