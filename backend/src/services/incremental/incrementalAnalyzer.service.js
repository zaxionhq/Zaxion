/**

 * Orchestrates incremental parse + merkle + metadata for fact snapshots.

 */

import { incrementalFlags } from './incrementalFeatureFlags.service.js';

import { TreeSitterParserService } from './treeSitterParser.service.js';

import { NodeCanonicalizerService } from './nodeCanonicalizer.service.js';

import { MerkleHashService } from './merkleHash.service.js';

import { sha256 } from './merkleHash.service.js';

import { incrementalCache } from './incrementalCache.service.js';

import { classifyFileKind, detectLanguageFromPath } from './fileKindClassifier.service.js';

import { extractShallowFacts, cacheNodeFacts } from './nodeFactExtractor.service.js';

import { detectChangedFiles } from './changedNodeDetector.service.js';

import { incrementalMetrics } from './incrementalMetrics.service.js';

import { INCREMENTAL_ENGINE_VERSION } from './incrementalTypes.js';



export class IncrementalAnalyzerService {

  constructor() {

    this.parser = new TreeSitterParserService();

    this.canonicalizer = new NodeCanonicalizerService();

    this.merkle = new MerkleHashService();

  }



  /**

   * Analyze one file (shadow-safe; returns metadata only).

   * @param {string} content

   * @param {string} filePath

   * @param {object} [opts]

   * @param {object} [opts.previousFileMeta]

   */

  analyzeFile(content, filePath, opts = {}) {

    if (incrementalFlags.isForcedLegacy()) {

      return null;

    }



    const file_kind = classifyFileKind(filePath);

    const language = detectLanguageFromPath(filePath);

    const file_hash = sha256(content || '');



    const parseStart = Date.now();

    const parseResult = this.parser.parse(content, filePath);

    if (parseResult?.skipped) {

      return null;

    }



    incrementalMetrics.recordParse({

      parser_engine: parseResult.parser_engine,

      language,

      status: parseResult.success ? 'success' : 'error',

      durationMs: Date.now() - parseStart,

    });



    const nodes = [];

    if (parseResult?.success && parseResult.root) {

      const rootNode = this.canonicalizer.toCanonicalNode({

        file_path: filePath,

        node_kind: parseResult.root.type || 'Program',

        start_byte: 0,

        end_byte: Buffer.byteLength(content || '', 'utf8'),

        start_line: 1,

        end_line: (content || '').split('\n').length,

        raw_text: content,

        parent_node_id: null,

      });

      nodes.push(rootNode);

    }



    let merkle = { root_subtree_hash: null, subtree_hashes_by_node: {} };

    if (incrementalFlags.isMerkleEnabled() && nodes.length > 0) {

      merkle = this.merkle.buildMerkleMap(nodes);

    }



    let shallow_facts = null;

    if (incrementalFlags.isParseEnabled() && parseResult?.success) {

      shallow_facts = extractShallowFacts(parseResult, filePath, content);

      if (merkle.root_subtree_hash && nodes[0]?.node_id) {

        cacheNodeFacts(nodes[0].node_id, merkle.root_subtree_hash, shallow_facts);

      }

    }



    if (incrementalFlags.isParseEnabled()) {

      const key = incrementalCache.parseKey({

        parser_engine: parseResult.parser_engine,

        parser_version: parseResult.parser_version,

        language,

        file_hash,

      });

      incrementalCache.setParse(key, {

        success: parseResult.success,

        file_kind,

        root_subtree_hash: merkle.root_subtree_hash,

      });

    }



    const prev = opts.previousFileMeta;

    const changed =

      !prev || prev.file_hash !== file_hash || prev.root_subtree_hash !== merkle.root_subtree_hash;



    return {

      enabled: true,

      analysis_mode: incrementalFlags.isEnforcementEnabled() ? 'incremental' : 'hybrid',

      engine_version: INCREMENTAL_ENGINE_VERSION,

      file_path: filePath,

      file_kind,

      language,

      file_hash,

      parser_engine: parseResult.parser_engine,

      parser_success: parseResult.success,

      root_subtree_hash: merkle.root_subtree_hash,

      node_count: nodes.length,

      changed,

      shallow_facts,

      flags: incrementalFlags.getActiveFlags(),

    };

  }



  /**

   * @param {Array<{ path?: string, content?: string, incremental?: object }>} files

   * @param {object} [previousIncremental]

   */

  analyzeFiles(files, previousIncremental = null) {

    const results = [];

    let changed_node_count = 0;

    const prevByPath = new Map();

    for (const f of previousIncremental?.files || []) {

      if (f.file_path) prevByPath.set(f.file_path, f);

    }



    for (const f of files || []) {

      const fp = f.path || f.filePath;

      if (!fp || !f.content) continue;

      const r = this.analyzeFile(f.content, fp, { previousFileMeta: prevByPath.get(fp) });

      if (r?.enabled) {

        results.push(r);

        if (r.changed) changed_node_count += r.node_count || 0;

      }

    }



    const changeSet = detectChangedFiles(previousIncremental, { files: results });

    const cacheStats = incrementalCache.stats();



    return {

      enabled: results.length > 0,

      engine_version: INCREMENTAL_ENGINE_VERSION,

      changed_node_count,

      changed_files: changeSet.changed_files,

      unchanged_files: changeSet.unchanged_files,

      files: results,

      root_subtree_hashes_by_file: Object.fromEntries(

        results.map((r) => [r.file_path, r.root_subtree_hash]).filter(([, h]) => h)

      ),

      routing_stats: { analyzed: results.length, changed: changeSet.changed_files.length },

      cache_hit_rates: cacheStats,

      flags: incrementalFlags.getActiveFlags(),

    };

  }

}



export const incrementalAnalyzer = new IncrementalAnalyzerService();

