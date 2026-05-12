<?php
/**
 * Snel Media Folders — WordPress query modifications.
 *
 * Hooks into WordPress's attachment query system to filter
 * the media library by folder.
 *
 * @package Snelstack
 */

namespace Snel\MediaFolders;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class QueryFilter {

	public function __construct() {
		add_filter( 'ajax_query_attachments_args', [ $this, 'filter_media_query' ] );
		add_filter( 'posts_clauses', [ $this, 'modify_query' ], 10, 2 );
		add_action( 'add_attachment', [ $this, 'auto_assign_on_upload' ] );
		add_action( 'delete_attachment', [ $this, 'clean_up_on_delete' ] );
	}

	/**
	 * When an attachment is deleted, remove it from all folders.
	 */
	public function clean_up_on_delete( $attachment_id ) {
		global $wpdb;
		$wpdb->delete(
			$wpdb->prefix . 'snel_folder_attachments',
			[ 'attachment_id' => $attachment_id ],
			[ '%d' ]
		);
	}

	/**
	 * When a file is uploaded and a folder is specified, auto-assign it.
	 */
	public function auto_assign_on_upload( $attachment_id ) {
		if ( isset( $_REQUEST['snel_folder'] ) && (int) $_REQUEST['snel_folder'] > 0 ) {
			Model::assign( (int) $_REQUEST['snel_folder'], [ $attachment_id ] );
		}
	}

	/**
	 * When the media library AJAX request includes a folder ID,
	 * pass it through to the query args.
	 */
	public function filter_media_query( $query ) {
		if ( isset( $_REQUEST['snel_folder'] ) ) {
			$query['snel_folder'] = (int) $_REQUEST['snel_folder'];
		}
		return $query;
	}

	/**
	 * Modify the SQL query to filter by folder.
	 *
	 * snel_folder values:
	 *   -1 = All files (no filter)
	 *    0 = Uncategorized (not in any folder)
	 *   >0 = Specific folder ID
	 */
	public function modify_query( $clauses, $query ) {
		global $wpdb;

		if ( $query->get( 'post_type' ) !== 'attachment' ) {
			return $clauses;
		}

		$folder_id = $query->get( 'snel_folder' );

		// No folder filter or "All Files" selected.
		if ( $folder_id === '' || $folder_id === -1 || $folder_id === '-1' ) {
			return $clauses;
		}

		$folder_id = (int) $folder_id;
		$rel_table = $wpdb->prefix . 'snel_folder_attachments';

		if ( $folder_id === 0 ) {
			// Uncategorized: attachments NOT in any folder.
			$clauses['where'] .= " AND {$wpdb->posts}.ID NOT IN (
				SELECT attachment_id FROM {$rel_table}
			)";
		} else {
			// Specific folder: JOIN to filter.
			$clauses['join'] .= $wpdb->prepare(
				" INNER JOIN {$rel_table} AS snel_fa ON ({$wpdb->posts}.ID = snel_fa.attachment_id AND snel_fa.folder_id = %d)",
				$folder_id
			);
		}

		return $clauses;
	}
}
