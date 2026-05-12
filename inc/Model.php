<?php
/**
 * Snel Media Folders — Database queries.
 *
 * Pure SQL via $wpdb. No request handling, no validation.
 *
 * @package Snelstack
 */

namespace Snel\MediaFolders;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Model {

	private static $folder_table   = 'snel_folders';
	private static $relation_table = 'snel_folder_attachments';

	/**
	 * Get all folders ordered by ord.
	 */
	public static function all() {
		global $wpdb;
		return $wpdb->get_results(
			"SELECT * FROM {$wpdb->prefix}" . self::$folder_table . " ORDER BY ord ASC"
		);
	}

	/**
	 * Get a single folder by ID.
	 */
	public static function find( $id ) {
		global $wpdb;
		return $wpdb->get_row(
			$wpdb->prepare(
				"SELECT * FROM {$wpdb->prefix}" . self::$folder_table . " WHERE id = %d",
				$id
			)
		);
	}

	/**
	 * Create a new folder.
	 */
	public static function create( $name, $parent = 0 ) {
		global $wpdb;

		// Check for duplicate name at same level.
		$exists = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}" . self::$folder_table . " WHERE name = %s AND parent = %d",
				$name,
				$parent
			)
		);

		if ( $exists > 0 ) {
			return false;
		}

		// Get next ord value.
		$max_ord = (int) $wpdb->get_var(
			$wpdb->prepare(
				"SELECT MAX(ord) FROM {$wpdb->prefix}" . self::$folder_table . " WHERE parent = %d",
				$parent
			)
		);

		$wpdb->insert(
			$wpdb->prefix . self::$folder_table,
			[
				'name'   => $name,
				'parent' => $parent,
				'ord'    => $max_ord + 1,
			],
			[ '%s', '%d', '%d' ]
		);

		return $wpdb->insert_id;
	}

	/**
	 * Rename a folder.
	 */
	public static function rename( $id, $name ) {
		global $wpdb;

		$folder = self::find( $id );
		if ( ! $folder ) {
			return false;
		}

		// Check for duplicate name at same level.
		$exists = $wpdb->get_var(
			$wpdb->prepare(
				"SELECT COUNT(*) FROM {$wpdb->prefix}" . self::$folder_table . " WHERE name = %s AND parent = %d AND id != %d",
				$name,
				$folder->parent,
				$id
			)
		);

		if ( $exists > 0 ) {
			return false;
		}

		$wpdb->update(
			$wpdb->prefix . self::$folder_table,
			[ 'name' => $name ],
			[ 'id' => $id ],
			[ '%s' ],
			[ '%d' ]
		);

		return true;
	}

	/**
	 * Delete a folder and its children recursively.
	 * Attachments are NOT deleted — they become uncategorized.
	 */
	public static function delete( $id ) {
		global $wpdb;

		$table    = $wpdb->prefix . self::$folder_table;
		$rel_table = $wpdb->prefix . self::$relation_table;

		// Get all child folder IDs recursively.
		$ids = self::get_descendant_ids( $id );
		$ids[] = (int) $id;

		$placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );

		// Delete relationships.
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$rel_table} WHERE folder_id IN ({$placeholders})",
				...$ids
			)
		);

		// Delete folders.
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$table} WHERE id IN ({$placeholders})",
				...$ids
			)
		);

		return true;
	}

	/**
	 * Get all descendant folder IDs recursively.
	 */
	private static function get_descendant_ids( $parent_id ) {
		global $wpdb;
		$table = $wpdb->prefix . self::$folder_table;

		$children = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT id FROM {$table} WHERE parent = %d",
				$parent_id
			)
		);

		$all = [];
		foreach ( $children as $child_id ) {
			$all[] = (int) $child_id;
			$all   = array_merge( $all, self::get_descendant_ids( $child_id ) );
		}

		return $all;
	}

	/**
	 * Assign attachments to a folder.
	 */
	public static function assign( $folder_id, $attachment_ids ) {
		global $wpdb;
		$table = $wpdb->prefix . self::$relation_table;

		foreach ( $attachment_ids as $attachment_id ) {
			// Remove from any existing folder first.
			$wpdb->delete( $table, [ 'attachment_id' => $attachment_id ], [ '%d' ] );

			// Assign to new folder (skip if uncategorized / folder_id = 0).
			if ( $folder_id > 0 ) {
				$wpdb->insert(
					$table,
					[
						'folder_id'     => $folder_id,
						'attachment_id' => $attachment_id,
					],
					[ '%d', '%d' ]
				);
			}
		}

		return true;
	}

	/**
	 * Get attachment counts per folder.
	 */
	public static function counts() {
		global $wpdb;
		$table = $wpdb->prefix . self::$relation_table;

		$results = $wpdb->get_results(
			"SELECT folder_id, COUNT(*) as count FROM {$table} GROUP BY folder_id"
		);

		$counts = [];
		foreach ( $results as $row ) {
			$counts[ (int) $row->folder_id ] = (int) $row->count;
		}

		return $counts;
	}

	/**
	 * Get total attachment count.
	 */
	public static function total_count() {
		global $wpdb;
		return (int) $wpdb->get_var(
			"SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_type = 'attachment' AND post_status = 'inherit'"
		);
	}

	/**
	 * Get attachment IDs in a folder.
	 */
	public static function attachments_in_folder( $folder_id ) {
		global $wpdb;
		$table = $wpdb->prefix . self::$relation_table;

		return $wpdb->get_col(
			$wpdb->prepare(
				"SELECT attachment_id FROM {$table} WHERE folder_id = %d",
				$folder_id
			)
		);
	}
}
