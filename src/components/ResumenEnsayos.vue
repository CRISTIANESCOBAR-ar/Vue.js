<template>
  <div class="w-full pt-2 px-2">
    <main class="w-full bg-white rounded-2xl shadow-xl px-6 py-5 border border-slate-200">
      <div class="flex flex-col gap-4 mb-5">
        <!-- Top row: título + búsqueda -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <h3 class="text-2xl font-semibold text-slate-800 whitespace-nowrap">Informe Completo de Ensayos</h3>
          <div class="flex items-center gap-2 flex-1">
            <label for="searchInput" class="sr-only">Buscar ensayos</label>
            <input id="searchInput" v-model="q" @input="onInput" type="search"
              placeholder="Buscar por Ensayo, Fecha, OE, Ne..." aria-label="Buscar ensayos"
              class="px-4 py-2 border border-slate-300 rounded-lg w-full sm:w-64 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all" />
            <button v-if="q" @click="clearSearch" title="Limpiar"
              class="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm whitespace-nowrap transition-colors duration-200">Limpiar</button>
          </div>
        </div>

        <!-- Bottom row: filtros + acciones -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <!-- Filtros de búsqueda -->
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-sm font-medium text-slate-600">Buscar en:</span>
            <label class="inline-flex items-center text-sm cursor-pointer">
              <input type="radio" name="searchField" class="mr-1.5 text-blue-600 focus:ring-blue-500" v-model="searchField" value="ALL" />
              <span class="text-slate-700">Todos</span>
            </label>
            <label class="inline-flex items-center text-sm cursor-pointer">
              <input type="radio" name="searchField" class="mr-1.5 text-blue-600 focus:ring-blue-500" v-model="searchField" value="OE" />
              <span class="text-slate-700">OE</span>
            </label>
            <label class="inline-flex items-center text-sm cursor-pointer">
              <input type="radio" name="searchField" class="mr-1.5 text-blue-600 focus:ring-blue-500" v-model="searchField" value="Ne" />
              <span class="text-slate-700">Ne</span>
            </label>
          </div>

          <!-- Acciones -->
          <div class="flex items-center gap-3">
            <span v-if="(debouncedQ || q) && rows.length >= 0" class="text-sm font-medium text-slate-600" aria-live="polite">{{
              filteredRows.length }} coincidencias</span>
            <button @click="loadRows"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm hover:shadow-md">Refrescar</button>
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
          <div v-if="filteredRows.length === 0" class="text-sm text-slate-600 mb-4 py-4 text-center bg-slate-50 rounded-lg">
            No hay coincidencias para la búsqueda.
          </div>

          <div class="overflow-auto w-full max-h-[70vh] rounded-xl border border-slate-200">
            <table class="min-w-full w-full table-auto divide-y divide-slate-200 text-xs">
              <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-20">
                <tr>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Ensayo</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Fecha</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">OE</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Ne</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Titulo</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">CVm %</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Delg -30%</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Delg -40%</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Delg -50%</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Grue +35%</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Grue +50%</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Neps +140%</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Neps +280%</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Fuerza B</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Elong. %</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Tenac.</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Trabajo B</th>
                  <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in filteredRows" :key="idx" class="border-t border-slate-100 hover:bg-blue-50/30 transition-colors duration-150">
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row.Ensayo }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row.Fecha }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row.OE }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row.Ne }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row.Titulo }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['CVm %'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Delg -30%'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Delg -40%'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Delg -50%'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Grue +35%'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Grue +50%'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Neps +140%'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Neps +280%'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Fuerza B'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Elong. %'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Tenac.'] }}</td>
                  <td class="px-3 py-2.5 text-center text-slate-700">{{ row['Trabajo B'] }}</td>
                  <td class="px-3 py-2.5 text-center">
                    <button @click="openDetail(row.Ensayo)" class="text-blue-600 hover:text-blue-700 hover:underline text-xs font-medium transition-colors duration-150">Ver
                      detalle</button>
                  </td>
                </tr>
              </tbody>
            </table>
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
      <div class="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col p-6 z-50 relative"
        role="document">
        <header class="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
          <h4 id="modalTitle" class="text-xl font-semibold text-slate-800">{{ modalTitle }}</h4>
          <button @click="closeModal"
            class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-200 font-medium"
            aria-label="Cerrar detalle">Cerrar</button>
        </header>

        <section class="overflow-auto flex-1">
          <div v-if="modalLoading" class="text-sm text-slate-600 py-8 text-center">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600">
            </div>
            <p class="mt-2">Cargando detalles...</p>
          </div>

          <div v-else>
            <div v-if="mergedRows.length === 0" class="text-sm text-slate-600 py-8 text-center">No hay datos para este
              ensayo.</div>
            <div v-else class="overflow-auto rounded-xl border border-slate-200">
              <table class="min-w-full text-xs">
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0">
                  <tr>
                    <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Huso</th>
                    <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Titulo</th>
                    <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">CVm %</th>
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
                    <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Fuerza B
                    </th>
                    <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Elongación
                      %</th>
                    <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Tenacidad
                    </th>
                    <th class="px-3 py-3 text-center font-semibold text-slate-700 border-b border-slate-200">Trabajo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, idx) in mergedRows" :key="idx"
                    class="hover:bg-slate-50 transition-colors duration-150">
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.NO }}</td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.TITULO }}</td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.CVM_PERCENT }}
                    </td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.DELG_MINUS30_KM
                      }}</td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.DELG_MINUS40_KM
                      }}</td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.DELG_MINUS50_KM
                      }}</td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.GRUE_35_KM }}
                    </td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.GRUE_50_KM }}
                    </td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.NEPS_140_KM }}
                    </td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.NEPS_280_KM }}
                    </td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.FUERZA_B }}</td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.ELONGACION }}
                    </td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.TENACIDAD }}
                    </td>
                    <td class="px-3 py-2.5 text-center border-b border-slate-100 text-slate-700">{{ row.TRABAJO }}</td>
                  </tr>

                  <!-- statistics rows -->
                  <tr class="bg-gradient-to-r from-blue-50 to-indigo-50 font-semibold border-t-2 border-blue-200">
                    <td class="px-3 py-3 text-slate-700">Promedio</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.avg) }}</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.avg) }}</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.avg) }}
                    </td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.avg) }}
                    </td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.avg) }}
                    </td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.avg) }}</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.avg) }}</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.avg) }}</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.avg) }}</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.avg) }}</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.avg) }}</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.avg) }}</td>
                    <td class="px-3 py-3 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.avg) }}</td>
                  </tr>

                  <tr class="bg-blue-50/50 font-medium">
                    <td class="px-3 py-2.5 text-slate-700">CV</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.cv) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.cv) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.cv) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.cv) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.cv) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.cv) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.cv) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.cv) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.cv) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.cv) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.cv) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.cv) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.cv) }}</td>
                  </tr>

                  <tr class="bg-indigo-50/50 font-medium">
                    <td class="px-3 py-2.5 text-slate-700">s</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.sd) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.sd) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.sd) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.sd) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.sd) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.sd) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.sd) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.sd) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.sd) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.sd) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.sd) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.sd) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.sd) }}</td>
                  </tr>

                  <tr class="bg-blue-50/50 font-medium">
                    <td class="px-3 py-2.5 text-slate-700">Q95</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.q95) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.q95) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.q95) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.q95) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.q95) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.q95) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.q95) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.q95) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.q95) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.q95) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.q95) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.q95) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.q95) }}</td>
                  </tr>

                  <tr class="bg-indigo-50/50 font-medium">
                    <td class="px-3 py-2.5 text-slate-700">Máx</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.max) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.max) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.max) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.max) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.max) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.max) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.max) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.max) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.max) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.max) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.max) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.max) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.max) }}</td>
                  </tr>

                  <tr class="bg-blue-50/50 font-medium">
                    <td class="px-3 py-2.5 text-slate-700">Mín</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TITULO.min) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.CVM_PERCENT.min) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS30_KM.min) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS40_KM.min) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.DELG_MINUS50_KM.min) }}
                    </td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_35_KM.min) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.GRUE_50_KM.min) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_140_KM.min) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.NEPS_280_KM.min) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.FUERZA_B.min) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.ELONGACION.min) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TENACIDAD.min) }}</td>
                    <td class="px-3 py-2.5 text-center text-slate-700">{{ fmtStat(combinedStats.TRABAJO.min) }}</td>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
  if (!term) return rows.value || []
  const parts = term.split(/\s+/).filter(Boolean)
  return (rows.value || []).filter((r) => {
    if (!r) return false
    // Search across selected fields (determined by radio button selection)
    return parts.every((p) => {
      return fieldsToCheck.value.some((field) => {
        const val = r[field]
        if (val == null || val === '') return false
        return String(val).toLowerCase().includes(p)
      })
    })
  })
})

onUnmounted(() => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
})

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
  return v.toFixed(2)
}

// Format cell value (raw data in modal)
function fmtCell(v) {
  if (v == null || v === '') return '-'
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  return n.toFixed(2)
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
