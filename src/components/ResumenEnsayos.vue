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
                  title="Filtrar por OE" aria-label="Filtrar por OE"
                  class="px-2 py-1 border border-slate-200 rounded-md text-sm w-24" />
                <label class="sr-only" for="neFilter">Ne</label>
                <input id="neFilter" v-model.trim="neQuery" type="search" placeholder="Ne"
                  title="Filtrar por título" aria-label="Filtrar por título"
                  class="px-2 py-1 border border-slate-200 rounded-md text-sm w-20" />
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

          <div class="overflow-auto _minimal-scroll w-full max-h-[calc(100vh-5rem)] rounded-xl border border-slate-200 pb-0">
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
            <div class="text-sm text-slate-600">Mostrando {{ startDisplay }}–{{ endDisplay }} de {{ filteredRows.length }}</div>
              <div class="flex items-center gap-2">
                <label class="text-sm text-slate-600">Filas:</label>
                <select v-model.number="pageSize" class="text-sm px-2 py-1 border rounded-md">
                  <option v-for="s in [10,25,50,100,0]" :key="s" :value="s">{{ s === 0 ? 'Todos' : s }}</option>
                </select>

                <!-- first / prev -->
                <button @click="page = 1" :disabled="page <= 1"
                  class="px-2 py-1 bg-slate-100 disabled:opacity-50 rounded-md text-sm" title="Primera">« Primera</button>
                <button @click="page = Math.max(1, page - 1)" :disabled="page <= 1"
                  class="px-2 py-1 bg-slate-100 disabled:opacity-50 rounded-md text-sm" title="Anterior">‹ Anterior</button>

                <!-- go to page input -->
                <div class="flex items-center gap-1">
                  <label class="sr-only" for="gotoPage">Ir a página</label>
                  <input id="gotoPage" type="number" min="1" :max="totalPages" v-model.number.lazy="gotoPage"
                    @keydown.enter.prevent="goToPage()"
                    class="w-20 text-sm px-2 py-1 border rounded-md" placeholder="Página" />
                  <button @click="goToPage()" class="px-2 py-1 bg-slate-100 rounded-md text-sm">Ir</button>
                </div>

                <!-- page indicator and next/last -->
                <span class="text-sm text-slate-600">Página {{ page }} / {{ totalPages }}</span>
                <button @click="page = Math.min(totalPages, page + 1)" :disabled="page >= totalPages"
                  class="px-2 py-1 bg-slate-100 disabled:opacity-50 rounded-md text-sm" title="Siguiente">Siguiente ›</button>
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
        <header class="flex items-center justify-between mb-2 pb-1">
          <h4 id="modalTitle" class="text-xl font-semibold text-slate-800">{{ modalTitle }}</h4>
          <button @click="closeModal"
            class="px-4 py-[0.4rem] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 font-medium"
            aria-label="Cerrar detalle">Cerrar</button>
        </header>

        <section class="flex-1">
          <div v-if="modalLoading" class="text-sm text-slate-600 py-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600">
            </div>
            <p class="mt-2">Cargando detalles...</p>
          </div>

          <div v-else>
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
                    <td class="px-3 py-1 text-slate-700">Promedio</td>
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
                    <td class="px-3 py-1 text-slate-700">CV</td>
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
                    <td class="px-3 py-1 text-slate-700">s</td>
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
                    <td class="px-3 py-1 text-slate-700">Q95</td>
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
                    <td class="px-3 py-1 text-slate-700">Máx</td>
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
                    <td class="px-3 py-1 text-slate-700">Mín</td>
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
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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

const modalTitle = computed(() => {
  const u = selectedTestnr.value || '—'
  const t = (tensorTestnrs.value && tensorTestnrs.value[0]) || '—'
  return `Detalle completo del ensayo Uster ${u} y TensoRapid ${t}`
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
</style>
