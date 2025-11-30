<template>
  <main class="w-full h-screen flex flex-col bg-gray-50 overflow-hidden relative" style="padding: 4px !important;">
    <!-- Banner de recálculo -->
    <div 
      v-if="isRecalculating" 
      class="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-3 transition-all duration-300"
    >
      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span class="font-medium text-sm">Recalculando datos...</span>
    </div>

    <div class="w-full flex-1 min-h-0 bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col" style="padding: 12px !important;">
      <div class="flex flex-col gap-2 mb-3 flex-shrink-0">
        <div class="flex items-center gap-3 justify-between">
          <div class="flex items-center gap-2 border border-slate-200 bg-white text-slate-700 rounded shadow-sm" style="padding: 0.375rem 1rem;">
            <label class="text-sm font-medium shrink-0">Calidad:</label>
            <select v-model="selectedQLD" class="text-sm border-0 focus:outline-none focus:ring-0 bg-transparent cursor-pointer">
              <option value="1">1</option>
              <option value="2">2</option>
            </select>
            
            <div class="h-4 w-px bg-slate-300 mx-1"></div>
            
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showDirecNormal" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span class="text-sm">Normal</span>
            </label>
            
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showDirec70" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span class="text-sm">70</span>
            </label>
            
            <label class="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="showBloqueados" class="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
              <span class="text-sm">Bloq</span>
            </label>
          </div>

          <div class="flex items-center gap-3">
            <label class="text-sm font-semibold text-slate-700 shrink-0">Carpeta del archivo de stock:</label>
          
            <div class="w-[100px] shrink-0">
              <div 
                class="border border-slate-300 rounded bg-white text-sm text-slate-800 truncate shadow-sm"
                :title="selectedFolderPath"
                style="padding: 0.25rem 0.5rem;"
              >
                {{ selectedFolderPath || 'Ninguna carpeta seleccionada' }}
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                @click="selectFolder" 
                class="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors duration-150 shadow-sm hover:shadow-md"
                style="padding: 0.25rem 0.5rem;"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7a2 2 0 012-2h3l2 3h6a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                </svg>
                Seleccionar
              </button>

              <input
                ref="fileInputRef"
                type="file"
                webkitdirectory
                directory
                multiple
                @change="handleFolderSelectFallback"
                class="hidden"
              />

              <button
                v-if="hasPersistedHandle"
                @click="refreshFolder"
                :disabled="isProcessing"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 rounded text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm hover:shadow-md"
                style="padding: 0.25rem 0.5rem;"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refrescar
              </button>

              <button 
                @click="openBackupsModal" 
                class="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors duration-150 shadow-sm hover:shadow-md ml-2"
                style="padding: 0.25rem 0.5rem;"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                Backups
              </button>

              <button 
                @click="exportToExcel" 
                :disabled="!filteredData.length"
                class="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 rounded text-sm font-medium hover:bg-slate-50 transition-colors duration-150 shadow-sm hover:shadow-md ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style="padding: 0.25rem 0.5rem;"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-sm text-slate-600 justify-end">
          <span v-if="lastUpdate" class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700">
            <span class="font-medium">Última actualización:</span>
            <span>{{ formatDate(lastUpdate) }}</span>
          </span>
        </div>
      </div>

      <div v-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.29 14.32A2 2 0 003.34 21h17.32a2 2 0 001.71-2.82L14.08 3.86a2 2 0 00-3.46 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>

      <div v-if="fileData" class="flex-1 min-h-0 flex flex-col">
        <div class="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
          <div class="flex flex-col h-auto max-h-full" style="max-width: 530px;">
            <div class="overflow-auto _minimal-scroll rounded border border-slate-200 shadow-sm" style="border-radius: 0.25rem;">
              <table class="w-full table-fixed divide-y divide-slate-200 text-xs">
                <colgroup>
                  <col style="width: 100px" />
                  <col style="width: 105px" />
                  <col style="width: 25px" />
                  <col style="width: 30px" />
                  <col style="width: 45px" />
                  <col style="width: 45px" />
                  <col style="width: 45px" />
                  <col style="width: 45px" />
                </colgroup>
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-20">
                  <tr>
                    <th class="text-xs font-semibold text-slate-600 text-left" style="padding: 6px 0.5rem 6px 1rem;">Artículo</th>
                    <th class="text-xs font-semibold text-slate-600 text-left" style="padding: 6px 0.75rem;">Nombre</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 6px 0.75rem;">Cal</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 6px 0.75rem;">Part.</th>
                    <th class="text-xs font-semibold text-slate-600" style="padding: 6px 0.25rem; text-align: right;">Metros</th>
                    <th class="text-xs font-semibold text-slate-600" style="padding: 6px 0.25rem; text-align: right;">Confe</th>
                    <th class="text-xs font-semibold text-slate-600" style="padding: 6px 0.75rem; text-align: right;">Mayo</th>
                    <th class="text-xs font-semibold text-slate-600" style="padding: 6px 0.75rem; text-align: right;">70</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="(row, rowIndex) in filteredData"
                    :key="rowIndex"
                    @click="selectRow(row)"
                    :class="[
                      'cursor-pointer transition-colors duration-150 hover:bg-blue-50/50',
                      selectedRow && selectedRow.ARTIGO === row.ARTIGO && selectedRow.NOME_MERCADO === row.NOME_MERCADO ? 'bg-blue-50/70 font-semibold text-slate-800' : 'bg-white'
                    ]"
                  >
                    <td class="text-left text-slate-700 truncate" style="padding: 0.25rem 0.5rem 0.25rem 1rem;">{{ formatArticulo(row.ARTIGO) }}</td>
                    <td class="text-left text-slate-700 truncate" style="padding: 0.25rem 0.75rem;" :title="row.NOME_MERCADO">{{ row.NOME_MERCADO }}</td>
                    <td class="text-center text-slate-700" style="padding: 0.25rem 0.75rem;">{{ row.QLD }}</td>
                    <td class="text-center text-slate-700" style="padding: 0.25rem 0.75rem;">{{ row.CANTIDAD_PARTIDAS }}</td>
                    <td class="text-slate-700" style="padding: 0.25rem 0.25rem; text-align: right;">{{ formatMetros(row.METROS) }}</td>
                    <td class="text-slate-700" style="padding: 0.25rem 0.25rem; text-align: right;">{{ formatMetros(row.CONFECCIONISTA) }}</td>
                    <td class="text-slate-700" style="padding: 0.25rem 0.75rem; text-align: right;">{{ formatMetros(row.MAYORISTA) }}</td>
                    <td class="text-slate-700" style="padding: 0.25rem 0.75rem; text-align: right;">{{ formatMetros(row.SETENTA) }}</td>
                  </tr>
                  <tr v-if="filteredData.length === 0">
                    <td colspan="8" class="px-3 py-6 text-center text-slate-500">No se encontraron registros con QLD = {{ selectedQLD }}.</td>
                  </tr>
                </tbody>
                <tfoot v-if="filteredData.length > 0" class="bg-slate-50 border-t-2 border-slate-300">
                  <tr class="font-semibold">
                    <td class="text-left text-slate-700" style="padding: 0.25rem 0.5rem 0.25rem 1rem;"></td>
                    <td class="text-left text-slate-700" style="padding: 0.25rem 0.75rem;">{{ filteredData.length }}</td>
                    <td class="text-center text-slate-700" style="padding: 0.25rem 0.75rem;"></td>
                    <td class="text-center text-slate-700" style="padding: 0.25rem 0.75rem;">{{ totalPartidas }}</td>
                    <td class="text-slate-700" style="padding: 0.25rem 0.25rem; text-align: right;">{{ formatMetros(totalMetros) }}</td>
                    <td class="text-slate-700" style="padding: 0.25rem 0.25rem; text-align: right;">{{ formatMetros(totalConfeccionista) }}</td>
                    <td class="text-slate-700" style="padding: 0.25rem 0.75rem; text-align: right;">{{ formatMetros(totalMayorista) }}</td>
                    <td class="text-slate-700" style="padding: 0.25rem 0.75rem; text-align: right;">{{ formatMetros(totalSetenta) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div v-if="selectedRow" class="flex flex-col h-auto max-h-full flex-none" style="width: 315px;">
            <div class="overflow-auto _minimal-scroll rounded border border-slate-200 shadow-sm">
              <table class="w-full table-fixed divide-y divide-slate-200 text-xs">
                <colgroup>
                  <col style="width: 85px" />
                  <col style="width: 15px" />
                  <col style="width: 45px" />
                  <col style="width: 15px" />
                  <col style="width: 15px" />
                  <col style="width: 40px" />
                  <col style="width: 40px" />
                  <col style="width: 40px" />
                </colgroup>
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                  <tr>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 4px;">Partida</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 4px;">D</th>
                    <th class="text-xs font-semibold text-slate-600 text-right" style="padding: 4px 4px;">Metros</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 4px;">S</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 4px;">R</th>
                    <th class="text-xs font-semibold text-slate-600 text-right" style="padding: 4px 4px;">Confe</th>
                    <th class="text-xs font-semibold text-slate-600 text-right" style="padding: 4px 4px;">Mayo</th>
                    <th class="text-xs font-semibold text-slate-600 text-right" style="padding: 4px 4px;">70</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr
                    v-for="(detail, detailIndex) in partidaDetail"
                    :key="detailIndex"
                    @click="selectPartida(detail)"
                    :class="[
                      'cursor-pointer transition-colors duration-150 hover:bg-blue-50/50',
                      selectedPartida && selectedPartida.PARTIDA === detail.PARTIDA && selectedPartida.DIREC === detail.DIREC ? 'bg-blue-50/70 font-semibold text-slate-800' : 'bg-white'
                    ]"
                  >
                    <td class="text-center text-slate-700 truncate" style="padding: 4px 4px;">{{ formatPartida(detail.PARTIDA) }}</td>
                    <td class="text-center text-slate-700" style="padding: 4px 4px;">{{ detail.DIREC }}</td>
                    <td class="text-right text-slate-700" style="padding: 4px 4px;">{{ formatMetros(detail.METROS) }}</td>
                    <td class="text-center text-slate-700 truncate" style="padding: 4px 4px;" :title="detail.STATUS">{{ detail.STATUS }}</td>
                    <td class="text-center text-slate-700 truncate" style="padding: 4px 4px;" :title="detail.REPROCESSO">{{ detail.REPROCESSO }}</td>
                    <td class="text-right text-slate-700" style="padding: 4px 4px;">{{ formatMetros(detail.CONFE) }}</td>
                    <td class="text-right text-slate-700" style="padding: 4px 4px;">{{ formatMetros(detail.MAYO) }}</td>
                    <td class="text-right text-slate-700" style="padding: 4px 4px;">{{ formatMetros(detail.SETENTA) }}</td>
                  </tr>
                </tbody>
                <tfoot class="bg-slate-50">
                  <tr>
                    <td colspan="2" class="text-center text-slate-600 font-semibold uppercase" style="padding: 4px 4px;">Total</td>
                    <td class="text-right text-slate-700 font-semibold" style="padding: 4px 4px;">{{ formatMetros(totalMetrosPartida) }}</td>
                    <td colspan="2"></td>
                    <td class="text-right text-slate-700 font-semibold" style="padding: 4px 4px;">{{ formatMetros(totalConfePartida) }}</td>
                    <td class="text-right text-slate-700 font-semibold" style="padding: 4px 4px;">{{ formatMetros(totalMayoPartida) }}</td>
                    <td class="text-right text-slate-700 font-semibold" style="padding: 4px 4px;">{{ formatMetros(totalSetentaPartida) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div v-if="selectedPartida" class="flex flex-col h-auto max-h-full flex-none" style="width: 370px;">
            <div class="overflow-auto _minimal-scroll rounded border border-slate-200 shadow-sm">
              <table class="w-full table-fixed divide-y divide-slate-200 text-xs">
                <colgroup>
                  <col style="width: 35px" />
                  <col style="width: 45px" />
                  <col style="width: 30px" />
                  <col style="width: 30px" />
                  <col style="width: 50px" />
                  <col style="width: 40px" />
                  <col style="width: 25px" />
                  <col style="width: 70px" />
                </colgroup>
                <thead class="bg-gradient-to-r from-slate-50 to-slate-100 sticky top-0 z-10">
                  <tr>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 2px;">Seq</th>
                    <th class="text-xs font-semibold text-slate-600 text-right" style="padding: 4px 2px;">Metros</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 2px;">Pts</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 2px;">Nu</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 2px;">D</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 2px;">Ancho</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 2px;">Em</th>
                    <th class="text-xs font-semibold text-slate-600 text-center" style="padding: 4px 2px;">Cliente</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-for="(registro, regIndex) in registrosPartida" :key="regIndex" class="bg-white">
                    <td class="text-center text-slate-700 truncate" style="padding: 4px 2px;">{{ registro.SEQ }}</td>
                    <td class="text-right text-slate-700" style="padding: 4px 2px;">{{ formatMetros(registro.METROS) }}</td>
                    <td class="text-center text-slate-700" style="padding: 4px 2px;">{{ registro.PONT }}</td>
                    <td class="text-center text-slate-700" style="padding: 4px 2px;">{{ registro.NUANCE }}</td>
                    <td class="text-center text-slate-700" style="padding: 4px 2px;">
                      <select 
                        :value="getDirec(registro)" 
                        @change="updateDirec(registro.SEQ, $event.target.value)"
                        class="bg-transparent border-none focus:ring-0 text-xs p-0 w-full text-center cursor-pointer outline-none"
                      >
                        <option value="">Normal</option>
                        <option v-for="opt in direcOptions" :key="opt" :value="opt">{{ opt }}</option>
                      </select>
                    </td>
                    <td class="text-center text-slate-700" style="padding: 4px 2px;">{{ registro.LARGURA }}</td>
                    <td class="text-center text-slate-700" style="padding: 4px 2px;">{{ registro.EMEND }}</td>
                    <td class="text-center text-slate-700" style="padding: 4px 2px;">
                      <select 
                        :value="getCliente(registro)" 
                        @change="updateCliente(registro.SEQ, $event.target.value)"
                        class="bg-transparent border-none focus:ring-0 text-xs p-0 w-full text-center cursor-pointer outline-none"
                      >
                        <option value="">-</option>
                        <option value="Confe">Confe</option>
                        <option value="Mayo">Mayo</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-slate-50">
                  <tr>
                    <td class="text-center text-slate-600 font-semibold uppercase" style="padding: 4px 2px;">Total</td>
                    <td class="text-right text-slate-700 font-semibold" style="padding: 4px 2px;">{{ formatMetros(totalMetrosRegistros) }}</td>
                    <td colspan="6"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-1 items-center justify-center text-center text-slate-600">
        <div class="flex flex-col items-center gap-3">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14m7-7H5" />
            </svg>
          </div>
          <p class="text-base font-semibold">Selecciona un archivo XLSX para comenzar</p>
          <p class="text-sm text-slate-500">Los datos se guardan automáticamente en tu navegador.</p>
        </div>
      </div>
    </div>

    <!-- Backups Modal -->
    <div v-if="showBackupsModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-opacity duration-300">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden transform transition-all scale-100">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <div class="flex items-center gap-3">
            <div class="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div>
              <h3 class="font-bold text-slate-800 text-lg">Copias de Seguridad</h3>
              <p class="text-xs text-slate-500">Gestiona tus puntos de restauración locales</p>
            </div>
          </div>
          <button 
            @click="showBackupsModal = false" 
            class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          
          <!-- Create Action -->
          <div class="bg-gradient-to-br from-indigo-50 to-white p-5 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between gap-4">
            <div class="flex-1">
              <h4 class="font-semibold text-indigo-900 mb-1">Crear nuevo punto</h4>
              <p class="text-xs text-indigo-600/80 leading-relaxed">Guarda el estado actual de tu trabajo para recuperarlo más tarde.</p>
            </div>
            <button 
              @click="createBackup" 
              :disabled="!fileData || isSavingBackup"
              class="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95 font-medium text-sm"
            >
              <svg v-if="isSavingBackup" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>{{ isSavingBackup ? 'Guardando...' : 'Guardar' }}</span>
            </button>
          </div>

          <!-- History List -->
          <div>
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">Historial Reciente</h4>
            
            <div v-if="backups.length === 0" class="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
              <div class="p-3 bg-slate-100 rounded-full text-slate-300 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-sm font-medium text-slate-500">No hay copias guardadas</p>
              <p class="text-xs text-slate-400 mt-1">Tus backups aparecerán aquí</p>
            </div>

            <div v-else class="space-y-2">
              <div 
                v-for="backup in backups" 
                :key="backup.id"
                class="group flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all duration-200"
              >
                <div class="flex items-center gap-3 overflow-hidden">
                  <div class="shrink-0 h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="font-semibold text-slate-700 text-sm truncate">{{ formatDate(backup.date) }}</span>
                    <span class="text-xs text-slate-400 truncate max-w-[200px]">{{ backup.fileName }}</span>
                  </div>
                </div>
                
                <div class="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="restoreBackup(backup.id)"
                    class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Restaurar esta versión"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <div class="w-px h-4 bg-slate-200 mx-1"></div>
                  <button 
                    @click="removeBackup(backup.id)"
                    class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar permanentemente"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Footer (optional, maybe just padding) -->
        <div class="bg-slate-50 px-6 py-3 border-t border-slate-100 text-center">
          <p class="text-[10px] text-slate-400">Los backups se almacenan localmente en tu navegador.</p>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, shallowRef, watch, nextTick } from 'vue'
import { useExcelReader } from '../composables/useExcelReader'
import { useLocalStorage } from '../composables/useLocalStorage'
import { saveSnapshot, getSnapshots, loadSnapshot, deleteSnapshot } from '../db'
import { utils, writeFile } from 'xlsx-js-style'

const { readExcelFile } = useExcelReader()
const { data, loadData, saveData, clearData } = useLocalStorage()

const fileInputRef = ref(null)
const selectedFile = ref(null)
const selectedFolderPath = ref(null)
const selectedDirHandle = ref(null)
const hasPersistedHandle = ref(false)
const fileData = shallowRef(null) // Changed to shallowRef for performance
const isProcessing = ref(false)
const isRecalculating = ref(false)
const error = ref(null)
const lastUpdate = ref(null)
const selectedRow = ref(null)
const selectedPartida = ref(null)
const clientOverrides = ref({})
const direcOverrides = ref({})
const direcOptions = ['34', '43', '99', '70', '53', '04', '19', '03', '01', '10', '02', '05']

// Backups state
const showBackupsModal = ref(false)
const backups = ref([])
const isSavingBackup = ref(false)

// Filtros de checkbox
const showBloqueados = ref(false)
const showDirec70 = ref(true)
const showDirecNormal = ref(true)
const selectedQLD = ref('1')

// Refs para datos calculados (antes computed)
const filteredData = shallowRef([])
const partidaDetail = shallowRef([])
const registrosPartida = shallowRef([])

const updateCliente = (seq, value) => {
  if (!seq) return
  
  // Actualizar overrides
  if (!value) {
    const newOverrides = { ...clientOverrides.value }
    delete newOverrides[seq]
    clientOverrides.value = newOverrides
  } else {
    clientOverrides.value = {
      ...clientOverrides.value,
      [seq]: value
    }
  }
  
  // Guardar cambios
  if (fileData.value) {
    const dataToSave = {
      ...fileData.value,
      fileName: fileData.value.fileName || selectedFile.value?.name,
      folderPath: selectedFolderPath.value,
      clientOverrides: clientOverrides.value
    }
    saveData(dataToSave)
  }
  
  // Trigger recalculation
  triggerRecalculation('overrides')
}

const updateDirec = (seq, value) => {
  if (!seq) return
  
  // Actualizar overrides
  direcOverrides.value = {
    ...direcOverrides.value,
    [seq]: value
  }
  
  // Guardar cambios
  if (fileData.value) {
    const dataToSave = {
      ...fileData.value,
      fileName: fileData.value.fileName || selectedFile.value?.name,
      folderPath: selectedFolderPath.value,
      clientOverrides: clientOverrides.value,
      direcOverrides: direcOverrides.value
    }
    saveData(dataToSave)
  }
  
  // Trigger recalculation
  triggerRecalculation('overrides')
}

const getDirec = (registro) => {
  if (registro.SEQ && direcOverrides.value[registro.SEQ]) {
    return direcOverrides.value[registro.SEQ]
  }
  return registro.DIREC
}

// Función orquestadora de recálculos
const triggerRecalculation = (scope = 'all') => {
  isRecalculating.value = true
  
  // Usar setTimeout para permitir que el UI se actualice (muestre el banner)
  setTimeout(() => {
    try {
      if (scope === 'all' || scope === 'filters' || scope === 'overrides' || scope === 'file') {
        calculateFilteredData()
      }
      
      if (scope === 'all' || scope === 'row' || scope === 'overrides' || scope === 'file') {
        calculatePartidaDetail()
      }
      
      if (scope === 'all' || scope === 'partida' || scope === 'file') {
        calculateRegistrosPartida()
      }
    } catch (e) {
      console.error("Error recalculating:", e)
    } finally {
      isRecalculating.value = false
    }
  }, 50)
}

// Lógica de cálculo de filteredData (Tabla 1)
const calculateFilteredData = () => {
  if (!fileData.value || !fileData.value.data || fileData.value.data.length < 2) {
    filteredData.value = []
    return
  }

  const headers = fileData.value.data[0]
  const rows = fileData.value.data.slice(1)

  // Encontrar índices de las columnas
  const artigoIdx = headers.findIndex(h => h === 'ARTIGO')
  const nomeMercadoIdx = headers.findIndex(h => h === 'NOME_MERCADO')
  const qldIdx = headers.findIndex(h => h === 'QLD')
  const direcIdx = headers.findIndex(h => h === 'DIREC')
  const partidaIdx = headers.findIndex(h => h === 'PARTIDA')
  const metrosIdx = headers.findIndex(h => h === 'METROS')
  const pontIdx = headers.findIndex(h => h === 'PONT')
  const bloqIdx = headers.findIndex(h => h === 'BLOQ')
  const seqIdx = headers.findIndex(h => h === 'SEQ')

  if (artigoIdx === -1 || nomeMercadoIdx === -1 || qldIdx === -1 || direcIdx === -1 || partidaIdx === -1 || metrosIdx === -1) {
    error.value = 'No se encontraron todas las columnas requeridas: ARTIGO, NOME_MERCADO, QLD, DIREC, PARTIDA, METROS'
    filteredData.value = []
    return
  }

  // Filtrar por QLD = 1, DIREC vacío o 70, BLOQ vacío, y agrupar por ARTIGO + NOME_MERCADO
  const grouped = {}
  
  // Cachear valores de refs para evitar lecturas repetidas en el loop
  const _selectedQLD = selectedQLD.value
  const _showBloqueados = showBloqueados.value
  const _showDirec70 = showDirec70.value
  const _showDirecNormal = showDirecNormal.value
  const _clientOverrides = clientOverrides.value
  const _direcOverrides = direcOverrides.value

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const qld = row[qldIdx]
    
    if (qld != _selectedQLD) continue

    const seq = seqIdx !== -1 ? row[seqIdx] : null
    const direc = row[direcIdx]
    const bloq = bloqIdx !== -1 ? row[bloqIdx] : ''
    
    let direcStr = String(direc || '').trim()
    if (seq && _direcOverrides[seq]) {
      direcStr = String(_direcOverrides[seq]).trim()
    }

    const bloqStr = String(bloq || '').trim()
    
    const isDirec70 = direcStr === '70'
    const isDirecNormal = direcStr === ''
    
    if (!((isDirec70 && _showDirec70) || (isDirecNormal && _showDirecNormal))) continue
    
    const isBloqueado = bloqStr !== ''
    if (!_showBloqueados && isBloqueado) continue
      
    const artigo = row[artigoIdx] || ''
    const nomeMercado = row[nomeMercadoIdx] || ''
    const partida = row[partidaIdx] || ''
    const metros = parseFloat(row[metrosIdx]) || 0
    const pont = pontIdx !== -1 ? parseFloat(row[pontIdx]) || 0 : 0

    const key = `${artigo}|${nomeMercado}`

    if (!grouped[key]) {
      grouped[key] = {
        ARTIGO: artigo,
        NOME_MERCADO: nomeMercado,
        QLD: qld,
        CANTIDAD_PARTIDAS: 0,
        PARTIDAS: new Set(),
        METROS: 0,
        CONFECCIONISTA: 0,
        MAYORISTA: 0,
        SETENTA: 0
      }
    }

    grouped[key].PARTIDAS.add(partida)
    grouped[key].METROS += metros

    if (metros >= 50 && direcStr === '70') {
      grouped[key].SETENTA += metros
    }

    let cliente = ''
    if (seq && _clientOverrides[seq]) {
      cliente = _clientOverrides[seq]
    } else if (metros >= 50) {
      if (pont <= 20) cliente = 'Confe'
      else if (pont > 20) cliente = 'Mayo'
    }

    if (cliente === 'Confe') {
      grouped[key].CONFECCIONISTA += metros
    } else if (cliente === 'Mayo') {
      grouped[key].MAYORISTA += metros
    }
  }

  filteredData.value = Object.values(grouped).map(item => {
    item.CANTIDAD_PARTIDAS = item.PARTIDAS.size
    delete item.PARTIDAS
    return item
  })
}

// Lógica de cálculo de partidaDetail (Tabla 2)
const calculatePartidaDetail = () => {
  if (!selectedRow.value || !fileData.value || !fileData.value.data || fileData.value.data.length < 2) {
    partidaDetail.value = []
    return
  }

  const headers = fileData.value.data[0]
  const rows = fileData.value.data.slice(1)

  const artigoIdx = headers.findIndex(h => h === 'ARTIGO')
  const nomeMercadoIdx = headers.findIndex(h => h === 'NOME_MERCADO')
  const qldIdx = headers.findIndex(h => h === 'QLD')
  const direcIdx = headers.findIndex(h => h === 'DIREC')
  const partidaIdx = headers.findIndex(h => h === 'PARTIDA')
  const metrosIdx = headers.findIndex(h => h === 'METROS')
  const statusIdx = headers.findIndex(h => h === 'STATUS')
  const reprocessoIdx = headers.findIndex(h => h === 'REPROCESSO')
  const pontIdx = headers.findIndex(h => h === 'PONT')
  const seqIdx = headers.findIndex(h => h === 'SEQ')

  if (artigoIdx === -1 || nomeMercadoIdx === -1 || qldIdx === -1 || direcIdx === -1 || partidaIdx === -1 || metrosIdx === -1) {
    partidaDetail.value = []
    return
  }

  const grouped = {}
  const _selectedRow = selectedRow.value
  const _clientOverrides = clientOverrides.value
  const _direcOverrides = direcOverrides.value
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const artigo = row[artigoIdx] || ''
    const nomeMercado = row[nomeMercadoIdx] || ''
    
    if (artigo !== _selectedRow.ARTIGO || nomeMercado !== _selectedRow.NOME_MERCADO) continue

    const qld = row[qldIdx]
    if (qld != 1) continue

    const seq = seqIdx !== -1 ? row[seqIdx] : null
    const direc = row[direcIdx]
    let direcStr = String(direc || '').trim()
    if (seq && _direcOverrides[seq]) {
      direcStr = String(_direcOverrides[seq]).trim()
    }
    
    if (direcStr !== '' && direcStr !== '70') continue

    const partida = row[partidaIdx] || ''
    const metros = parseFloat(row[metrosIdx]) || 0
    const status = statusIdx !== -1 ? row[statusIdx] : ''
    const reprocesso = reprocessoIdx !== -1 ? row[reprocessoIdx] : ''
    const pont = pontIdx !== -1 ? parseFloat(row[pontIdx]) || 0 : 0

    const key = `${partida}|${direcStr}`

    if (!grouped[key]) {
      grouped[key] = {
        PARTIDA: partida,
        DIREC: direcStr,
        METROS: 0,
        CONFE: 0,
        MAYO: 0,
        SETENTA: 0,
        STATUS_SET: new Set(),
        REPROCESSO_SET: new Set()
      }
    }

    grouped[key].METROS += metros
    if (status) grouped[key].STATUS_SET.add(status)
    if (reprocesso) grouped[key].REPROCESSO_SET.add(reprocesso)

    if (metros >= 50 && direcStr === '70') {
      grouped[key].SETENTA += metros
    }

    let cliente = ''
    if (seq && _clientOverrides[seq]) {
      cliente = _clientOverrides[seq]
    } else if (metros >= 50) {
      if (pont <= 20) cliente = 'Confe'
      else if (pont > 20) cliente = 'Mayo'
    }

    if (cliente === 'Confe') {
      grouped[key].CONFE += metros
    } else if (cliente === 'Mayo') {
      grouped[key].MAYO += metros
    }
  }

  partidaDetail.value = Object.values(grouped).map(item => {
    return {
      ...item,
      STATUS: Array.from(item.STATUS_SET).join(','),
      REPROCESSO: Array.from(item.REPROCESSO_SET).join(',')
    }
  }).sort((a, b) => {
    const pA = String(a.PARTIDA || '')
    const pB = String(b.PARTIDA || '')

    // 1. Extraer "Rolada" (caracteres 3 al 6 -> índices 2 al 6 exclusivo)
    const roladaA = pA.substring(2, 6)
    const roladaB = pB.substring(2, 6)

    if (roladaA !== roladaB) {
      return roladaA.localeCompare(roladaB)
    }

    // 2. Extraer sufijo completo (caracteres 3 al 8 -> índices 2 al 8 exclusivo)
    const suffixA = pA.substring(2, 8)
    const suffixB = pB.substring(2, 8)

    if (suffixA !== suffixB) {
      return suffixA.localeCompare(suffixB)
    }

    // 3. Fallback al string completo (numérico/alfabético estándar)
    return pA.localeCompare(pB)
  })
}

// Lógica de cálculo de registrosPartida (Tabla 3)
const calculateRegistrosPartida = () => {
  if (!selectedPartida.value || !selectedRow.value || !fileData.value || !fileData.value.data || fileData.value.data.length < 2) {
    registrosPartida.value = []
    return
  }

  const headers = fileData.value.data[0]
  const rows = fileData.value.data.slice(1)

  const artigoIdx = headers.findIndex(h => h === 'ARTIGO')
  const nomeMercadoIdx = headers.findIndex(h => h === 'NOME_MERCADO')
  const qldIdx = headers.findIndex(h => h === 'QLD')
  const direcIdx = headers.findIndex(h => h === 'DIREC')
  const partidaIdx = headers.findIndex(h => h === 'PARTIDA')
  const metrosIdx = headers.findIndex(h => h === 'METROS')
  const seqIdx = headers.findIndex(h => h === 'SEQ')

  if (artigoIdx === -1 || nomeMercadoIdx === -1 || qldIdx === -1 || direcIdx === -1 || partidaIdx === -1 || metrosIdx === -1) {
    registrosPartida.value = []
    return
  }

  const registros = []
  const _selectedRow = selectedRow.value
  const _selectedPartida = selectedPartida.value
  const _direcOverrides = direcOverrides.value
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const artigo = row[artigoIdx] || ''
    const nomeMercado = row[nomeMercadoIdx] || ''
    const qld = row[qldIdx]
    const direc = row[direcIdx]
    const partida = row[partidaIdx] || ''
    const seq = seqIdx !== -1 ? row[seqIdx] : null
    
    let direcStr = String(direc || '').trim()
    if (seq && _direcOverrides[seq]) {
      direcStr = String(_direcOverrides[seq]).trim()
    }
    
    if (artigo === _selectedRow.ARTIGO && 
        nomeMercado === _selectedRow.NOME_MERCADO && 
        qld == _selectedRow.QLD &&
        partida === _selectedPartida.PARTIDA &&
        direcStr === _selectedPartida.DIREC &&
        (direcStr === '' || direcStr === '70')) {
      
      const registro = {}
      headers.forEach((header, idx) => {
        registro[header] = row[idx]
      })
      
      registros.push(registro)
    }
  }

  registrosPartida.value = registros
}

// Watchers para disparar recálculos
watch([fileData, selectedQLD, showBloqueados, showDirec70, showDirecNormal], () => {
  triggerRecalculation('filters')
}, { deep: false })

const selectRow = (row) => {
  selectedRow.value = row
  selectedPartida.value = null
  triggerRecalculation('row')
}

const selectPartida = (partida) => {
  selectedPartida.value = partida
  triggerRecalculation('partida')
}

// Total de metros
const totalMetros = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.METROS, 0)
})

// Total de partidas
const totalPartidas = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.CANTIDAD_PARTIDAS, 0)
})

// Total confeccionista
const totalConfeccionista = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.CONFECCIONISTA, 0)
})

// Total mayorista
const totalMayorista = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.MAYORISTA, 0)
})

// Total setenta
const totalSetenta = computed(() => {
  return filteredData.value.reduce((sum, row) => sum + row.SETENTA, 0)
})

// Detalle por partida de la fila seleccionada (Ahora calculado en calculatePartidaDetail)
// const partidaDetail = computed(() => { ... })

// Total metros de la partida seleccionada
const totalMetrosPartida = computed(() => {
  return partidaDetail.value.reduce((sum, row) => sum + row.METROS, 0)
})

const totalConfePartida = computed(() => {
  return partidaDetail.value.reduce((sum, row) => sum + row.CONFE, 0)
})

const totalMayoPartida = computed(() => {
  return partidaDetail.value.reduce((sum, row) => sum + row.MAYO, 0)
})

const totalSetentaPartida = computed(() => {
  return partidaDetail.value.reduce((sum, row) => sum + row.SETENTA, 0)
})

// Detalle de registros individuales de la partida seleccionada (Ahora calculado en calculateRegistrosPartida)
// const registrosPartida = computed(() => { ... })

// Total metros de los registros de la partida seleccionada
const totalMetrosRegistros = computed(() => {
  return registrosPartida.value.reduce((sum, row) => sum + (parseFloat(row.METROS) || 0), 0)
})

// --- File System Access API + IndexedDB helpers ---
function openDb() {
  return new Promise((resolve, reject) => {
    let req
    try {
      req = window.indexedDB.open('analisis-stock-db')
    } catch (err) {
      return reject(err)
    }
    req.onupgradeneeded = () => {
      const db = req.result
      try {
        if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles')
      } catch (e) {
        console.warn('openDb onupgradeneeded error', e)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveDirHandleToIDB(dirHandle) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readwrite')
    const store = tx.objectStore('handles')
    const r = store.put(dirHandle, 'stockDir')
    r.onsuccess = () => resolve(true)
    r.onerror = () => reject(r.error)
  })
}

async function getDirHandleFromIDB() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('handles', 'readonly')
    const store = tx.objectStore('handles')
    const r = store.get('stockDir')
    r.onsuccess = () => resolve(r.result)
    r.onerror = () => reject(r.error)
  })
}

async function verifyPermission(handle, mode = 'read') {
  if (!handle) return false
  try {
    const opts = { mode }
    if (await handle.queryPermission(opts) === 'granted') return true
    if (await handle.requestPermission(opts) === 'granted') return true
  } catch (err) {
    console.warn('verifyPermission error', err)
  }
  return false
}

async function selectFolder() {
  try {
    if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
      // Usar File System Access API
      const dirHandle = await window.showDirectoryPicker()
      
      // Guardar el handle en IndexedDB
      try {
        await saveDirHandleToIDB(dirHandle)
        hasPersistedHandle.value = true
      } catch (err) {
        console.warn('saveDirHandleToIDB failed', err)
      }
      
      selectedFolderPath.value = dirHandle.name || 'Carpeta seleccionada'
      selectedDirHandle.value = dirHandle
      
      // Procesar el archivo
      await processFileFromHandle(dirHandle)
      return
    }
  } catch (err) {
    console.warn('selectFolder error', err)
  }
  
  // Fallback: usar input webkitdirectory
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

async function processFileFromHandle(dirHandle) {
  try {
    // Buscar el archivo estoquePecas.xlsx en la carpeta
    let fileHandle = null
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && name === 'estoquePecas.xlsx') {
        fileHandle = handle
        break
      }
    }
    
    if (!fileHandle) {
      error.value = 'No se encontró el archivo "estoquePecas.xlsx" en la carpeta seleccionada.'
      return
    }
    
    // Leer el archivo
    const file = await fileHandle.getFile()
    selectedFile.value = file
    error.value = null
    
    await parseAndStore(file)
  } catch (err) {
    error.value = `Error al procesar la carpeta: ${err.message}`
    console.error(err)
  }
}

async function refreshFolder() {
  if (!selectedDirHandle.value) {
    // Intentar cargar desde IndexedDB
    try {
      const dirHandle = await getDirHandleFromIDB()
      if (!dirHandle) {
        error.value = 'No hay carpeta guardada. Por favor, selecciona una carpeta primero.'
        return
      }
      
      const ok = await verifyPermission(dirHandle, 'read')
      if (!ok) {
        error.value = 'No se concedieron permisos de lectura. Por favor, selecciona la carpeta nuevamente.'
        hasPersistedHandle.value = false
        return
      }
      
      selectedDirHandle.value = dirHandle
      selectedFolderPath.value = dirHandle.name || 'Carpeta seleccionada'
      hasPersistedHandle.value = true
    } catch (err) {
      error.value = 'Error al cargar la carpeta guardada. Por favor, selecciona una carpeta nuevamente.'
      console.error(err)
      return
    }
  }
  
  await processFileFromHandle(selectedDirHandle.value)
}

async function handleFolderSelectFallback(event) {
  const files = event.target.files
  if (!files || files.length === 0) return

  // Obtener la ruta de la carpeta desde el primer archivo
  const firstFile = files[0]
  if (firstFile.webkitRelativePath) {
    const parts = firstFile.webkitRelativePath.split('/')
    if (parts.length > 0) {
      selectedFolderPath.value = parts[0]
    }
  }

  // Buscar el archivo estoquePecas.xlsx
  let targetFile = null
  for (let i = 0; i < files.length; i++) {
    if (files[i].name === 'estoquePecas.xlsx') {
      targetFile = files[i]
      break
    }
  }

  if (targetFile) {
    selectedFile.value = targetFile
    error.value = null
    hasPersistedHandle.value = false
    await parseAndStore(targetFile)
  } else {
    error.value = 'No se encontró el archivo "estoquePecas.xlsx" en la carpeta seleccionada.'
    selectedFile.value = null
    selectedFolderPath.value = null
  }
}

onMounted(async () => {
  const savedData = loadData()
  if (savedData) {
    fileData.value = savedData
    lastUpdate.value = savedData.lastUpdate
    if (savedData.folderPath) {
      selectedFolderPath.value = savedData.folderPath
    }
    if (savedData.clientOverrides) {
      clientOverrides.value = savedData.clientOverrides
    }
    if (savedData.direcOverrides) {
      direcOverrides.value = savedData.direcOverrides
    }
    // Trigger initial calculation from saved data
    triggerRecalculation('file')
  }
  
  // Intentar cargar el handle persistido
  try {
    const dirHandle = await getDirHandleFromIDB()
    if (dirHandle) {
      const ok = await verifyPermission(dirHandle, 'read')
      if (ok) {
        selectedDirHandle.value = dirHandle
        selectedFolderPath.value = dirHandle.name || selectedFolderPath.value
        hasPersistedHandle.value = true
        
        // Cargar automáticamente el archivo
        await processFileFromHandle(dirHandle)
      } else {
        hasPersistedHandle.value = false
        console.log('La carpeta guardada no tiene permisos de lectura.')
      }
    }
  } catch (err) {
    console.warn('Error al cargar handle guardado:', err)
  }
})

const parseAndStore = async (file) => {
  if (!file) return
  isProcessing.value = true
  error.value = null

  try {
    const result = await readExcelFile(file)
    fileData.value = result
    clientOverrides.value = {} // Resetear overrides al cargar nuevo archivo
    direcOverrides.value = {}

    const dataToSave = {
      ...result,
      fileName: file.name,
      folderPath: selectedFolderPath.value,
      clientOverrides: {},
      direcOverrides: {}
    }
    const saved = saveData(dataToSave)
    if (saved) {
      lastUpdate.value = data.value?.lastUpdate || new Date().toISOString()
    }
    
    // Trigger initial calculation
    triggerRecalculation('file')
  } catch (err) {
    error.value = `Error al procesar el archivo: ${err.message}`
    console.error(err)
  } finally {
    isProcessing.value = false
  }
}

const clearAllData = () => {
  if (confirm('¿Estás seguro de que deseas eliminar todos los datos guardados?')) {
    clearData()
    fileData.value = null
    clientOverrides.value = {}
    direcOverrides.value = {}
    selectedFile.value = null
    selectedFolderPath.value = null
    selectedDirHandle.value = null
    hasPersistedHandle.value = false
    lastUpdate.value = null
    selectedRow.value = null
    selectedPartida.value = null
    filteredData.value = []
    partidaDetail.value = []
    registrosPartida.value = []
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  }
}

const formatMetros = (value) => {
  const rounded = Math.round(value)
  return rounded.toLocaleString('es-ES', { useGrouping: true })
}

const formatArticulo = (artigo) => {
  if (!artigo) return ''
  const str = String(artigo)
  if (str.length > 10) {
    return str.slice(0, 10) + ' ' + str.slice(10)
  }
  return str
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPartida = (partida) => {
  if (!partida) return ''
  const partidaStr = String(partida)
  // Quitar el primer carácter (5)
  const withoutFirst = partidaStr.substring(1)
  // Aplicar máscara: #-####.##
  // Ejemplo: 0539018 -> 0-5390.18
  if (withoutFirst.length >= 7) {
    const part1 = withoutFirst[0] // primer dígito
    const part2 = withoutFirst.substring(1, 5) // siguientes 4 dígitos
    const part3 = withoutFirst.substring(5, 7) // últimos 2 dígitos
    return `${part1}-${part2}.${part3}`
  }
  return withoutFirst
}

const getCliente = (registro) => {
  if (registro.SEQ && clientOverrides.value[registro.SEQ]) {
    return clientOverrides.value[registro.SEQ]
  }

  const metros = parseFloat(registro.METROS) || 0
  const pont = parseFloat(registro.PONT) || 0
  
  if (metros >= 50) {
    if (pont <= 20) return 'Confe'
    if (pont > 20) return 'Mayo'
  }
  return ''
}

// Backup functions
const openBackupsModal = async () => {
  showBackupsModal.value = true
  await loadBackups()
}

const loadBackups = async () => {
  backups.value = await getSnapshots()
}

const createBackup = async () => {
  if (!selectedFile.value || !fileData.value) return
  
  isSavingBackup.value = true
  try {
    await saveSnapshot(
      selectedFile.value,
      selectedFolderPath.value,
      fileData.value,
      clientOverrides.value,
      direcOverrides.value
    )
    await loadBackups()
  } catch (e) {
    console.error(e)
    alert('Error al crear backup')
  } finally {
    isSavingBackup.value = false
  }
}

const restoreBackup = async (id) => {
  try {
    const snapshot = await loadSnapshot(id)
    if (!snapshot) return
    
    fileData.value = snapshot.processedData
    clientOverrides.value = snapshot.clientOverrides || {}
    direcOverrides.value = snapshot.direcOverrides || {}
    selectedFolderPath.value = snapshot.folderPath
    
    if (snapshot.fileBlob) {
        selectedFile.value = new File([snapshot.fileBlob], snapshot.fileName, { type: snapshot.fileBlob.type })
    }
    
    lastUpdate.value = snapshot.date
    
    triggerRecalculation('file')
    
    showBackupsModal.value = false
  } catch (e) {
    console.error(e)
    alert('Error al restaurar backup')
  }
}

const removeBackup = async (id) => {
  if(!confirm('¿Eliminar este backup?')) return
  await deleteSnapshot(id)
  await loadBackups()
}

const exportToExcel = () => {
  if (!filteredData.value || filteredData.value.length === 0) return
  if (!fileData.value || !fileData.value.data) return

  const headers = fileData.value.data[0]
  const rows = fileData.value.data.slice(1)
  
  // Indices para búsqueda rápida
  const artigoIdx = headers.findIndex(h => h === 'ARTIGO')
  const nomeMercadoIdx = headers.findIndex(h => h === 'NOME_MERCADO')
  const qldIdx = headers.findIndex(h => h === 'QLD')
  const direcIdx = headers.findIndex(h => h === 'DIREC')
  const partidaIdx = headers.findIndex(h => h === 'PARTIDA')
  const metrosIdx = headers.findIndex(h => h === 'METROS')
  const pontIdx = headers.findIndex(h => h === 'PONT')
  const seqIdx = headers.findIndex(h => h === 'SEQ')

  const _clientOverrides = clientOverrides.value
  const _direcOverrides = direcOverrides.value

  let totalMayorista = 0
  let totalConfeccionista = 0
  let totalMetros = 0
  const nombresComercialesUnicos = new Set()

  const dataToExport = filteredData.value.map(row => {
    const artigoStr = String(row.ARTIGO || '')
    
    // Acumular totales
    totalMayorista += row.MAYORISTA || 0
    totalConfeccionista += row.CONFECCIONISTA || 0
    totalMetros += row.METROS || 0
    if (row.NOME_MERCADO) {
      nombresComercialesUnicos.add(row.NOME_MERCADO)
    }

    // Calcular detalle confeccionista y mayorista
    // Buscar todas las filas raw que corresponden a este grupo (Artigo + NomeMercado)
    const partidasMapConfe = {}
    const partidasMapMayo = {}

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      // Filtros básicos del grupo
      if (r[artigoIdx] !== row.ARTIGO || r[nomeMercadoIdx] !== row.NOME_MERCADO) continue
      
      // Filtros globales (QLD, DIREC) - Deben coincidir con lo que se ve en pantalla
      if (r[qldIdx] != selectedQLD.value) continue

      const seq = seqIdx !== -1 ? r[seqIdx] : null
      const direc = r[direcIdx]
      let direcStr = String(direc || '').trim()
      if (seq && _direcOverrides[seq]) {
        direcStr = String(_direcOverrides[seq]).trim()
      }
      
      // Filtro DIREC (Normal/70)
      const isDirec70 = direcStr === '70'
      const isDirecNormal = direcStr === ''
      if (!((isDirec70 && showDirec70.value) || (isDirecNormal && showDirecNormal.value))) continue

      const partida = r[partidaIdx]
      const metros = parseFloat(r[metrosIdx]) || 0
      const pont = pontIdx !== -1 ? parseFloat(r[pontIdx]) || 0 : 0

      // Calcular cliente
      let cliente = ''
      if (seq && _clientOverrides[seq]) {
        cliente = _clientOverrides[seq]
      } else if (metros >= 50) {
        if (pont <= 20) cliente = 'Confe'
        else if (pont > 20) cliente = 'Mayo'
      }

      const partidaStr = String(partida || '')
      // Agrupar por los últimos 6 caracteres
      const key = partidaStr.length >= 6 ? partidaStr.slice(-6) : partidaStr

      if (cliente === 'Confe') {
        if (!partidasMapConfe[key]) partidasMapConfe[key] = 0
        partidasMapConfe[key] += metros
      } else if (cliente === 'Mayo') {
        if (!partidasMapMayo[key]) partidasMapMayo[key] = 0
        partidasMapMayo[key] += metros
      }
    }

    // Función helper para formatear detalle
    const formatDetalle = (map) => {
      const groups = {}
      Object.entries(map).forEach(([key, metros]) => {
        // key ejemplo: 539018. Rolada: 3901 (índices 1,2,3,4)
        const rolada = key.length >= 5 ? key.substring(1, 5) : 'AAAA'
        if (!groups[rolada]) groups[rolada] = []
        groups[rolada].push({ key, metros })
      })

      const sortedRoladas = Object.keys(groups).sort()
      const resultParts = []

      sortedRoladas.forEach(rolada => {
        const items = groups[rolada]
        // Ordenar por sufijo (índices 5 en adelante)
        items.sort((a, b) => {
          const sufA = a.key.substring(5)
          const sufB = b.key.substring(5)
          return sufA.localeCompare(sufB)
        })

        if (items.length > 1) {
          const sum = items.reduce((acc, curr) => acc + curr.metros, 0)
          const vals = items.map(i => Math.round(i.metros)).join(' + ')
          resultParts.push(`(${vals} = ${Math.round(sum)})`)
        } else {
          resultParts.push(Math.round(items[0].metros))
        }
      })

      return resultParts.join(' + ')
    }

    const detalleConfe = formatDetalle(partidasMapConfe)
    const detalleMayo = formatDetalle(partidasMapMayo)

    return {
      'Articulo': artigoStr.slice(0, 10),
      'Color': artigoStr.slice(10),
      'Nombre Comercial': row.NOME_MERCADO,
      'Mayorista': row.MAYORISTA,
      'Confeccionista': row.CONFECCIONISTA,
      'Total': row.METROS,
      'Detalle Confeccionista': detalleConfe,
      'Detalle Mayorista': detalleMayo
    }
  })

  // Agregar fila de totales
  dataToExport.push({
    'Articulo': 'TOTALES',
    'Color': '',
    'Nombre Comercial': nombresComercialesUnicos.size,
    'Mayorista': totalMayorista,
    'Confeccionista': totalConfeccionista,
    'Total': totalMetros,
    'Detalle Confeccionista': '',
    'Detalle Mayorista': ''
  })

  const ws = utils.json_to_sheet(dataToExport)

  // Estilos
  const headerStyle = {
    font: { bold: true, color: { rgb: "FFFFFF" } },
    fill: { fgColor: { rgb: "4F46E5" } }, // Indigo 600
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  }

  const cellStyle = {
    alignment: { vertical: "center" },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  }

  const totalStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "F3F4F6" } }, // Gray 100
    alignment: { vertical: "center" },
    border: {
      top: { style: "medium" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  }

  // Aplicar estilos y anchos
  const range = utils.decode_range(ws['!ref'])
  const wscols = []

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = utils.encode_cell({ r: R, c: C })
      if (!ws[cell_address]) continue

      const cell = ws[cell_address]
      const isNumber = typeof cell.v === 'number'

      // Formato numérico para celdas con números
      if (isNumber) {
        cell.z = "#,##0"
      }

      // Header row
      if (R === 0) {
        cell.s = headerStyle
      } 
      // Total row (last row)
      else if (R === range.e.r) {
        cell.s = { ...totalStyle }
        if (isNumber) {
          // Alinear a la derecha con sangría (indent: 1)
          cell.s.alignment = { ...totalStyle.alignment, horizontal: "right", indent: 1 }
        }
      } 
      // Data rows
      else {
        cell.s = { ...cellStyle }
        if (isNumber) {
          // Alinear a la derecha con sangría (indent: 1)
          cell.s.alignment = { ...cellStyle.alignment, horizontal: "right", indent: 1 }
        }
      }
    }
  }

  // Calcular anchos de columna
  const keys = Object.keys(dataToExport[0])
  keys.forEach((key, i) => {
    let maxLen = key.length
    dataToExport.forEach(row => {
      const val = String(row[key] || '')
      if (val.length > maxLen) maxLen = val.length
    })
    wscols.push({ wch: maxLen + 2 })
  })
  ws['!cols'] = wscols

  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, "Stock")
  
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  
  const fileName = `Analisis_Stock_${day}${month}${year}_${hours}${minutes}${seconds}.xlsx`
  
  writeFile(wb, fileName)
}

</script>

<style scoped>
:global(._minimal-scroll) {
  scrollbar-width: thin;
  scrollbar-color: rgba(99, 102, 241, 0.35) transparent;
}

:global(._minimal-scroll::-webkit-scrollbar) {
  width: 8px;
}

:global(._minimal-scroll::-webkit-scrollbar-track) {
  background: transparent;
}

:global(._minimal-scroll::-webkit-scrollbar-thumb) {
  background: rgba(99, 102, 241, 0.35);
  border-radius: 999px;
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.14);
  transition: background 160ms linear, box-shadow 160ms linear;
}

:global(._minimal-scroll::-webkit-scrollbar-thumb:hover) {
  background: rgba(99, 102, 241, 0.65);
  box-shadow: 0 0 12px rgba(99, 102, 241, 0.24);
}

:global(._minimal-scroll::-webkit-scrollbar-thumb:active) {
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.28);
}

.align-right {
  text-align: right !important;
}
</style>
