<?php

/**
 * Snel Media Folders — Business logic.
 *
 * Receives WP_REST_Request, validates input, calls Model, returns response.
 *
 * @package Snelstack
 */

namespace Snel\MediaFolders;

if (! defined('ABSPATH')) {
	exit;
}

class Controller
{

	/**
	 * Get all folders with counts.
	 */
	public function get_folders(\WP_REST_Request $request)
	{
		$folders      = Model::all();
		$counts       = Model::counts();
		$total_count  = Model::total_count();

		// Attach count to each folder.
		$data = [];
		$categorized_count = 0;

		foreach ($folders as $folder) {
			$count = $counts[(int) $folder->id] ?? 0;
			$categorized_count += $count;

			$data[] = [
				'id'        => (int) $folder->id,
				'name'      => $folder->name,
				'parent'    => (int) $folder->parent,
				'ord'       => (int) $folder->ord,
				'count'     => $count,
				'createdAt' => $folder->created_at,
			];
		}

		return rest_ensure_response([
			'folders'          => $data,
			'totalCount'       => $total_count,
			'uncategorizedCount' => max(0, $total_count - $categorized_count),
		]);
	}

	/**
	 * Create a new folder.
	 */
	public function create_folder(\WP_REST_Request $request)
	{
		$name   = sanitize_text_field($request->get_param('name'));
		$parent = (int) $request->get_param('parent');

		if (empty($name)) {
			return new \WP_Error('missing_name', __('Folder name is required.', 'snel'), ['status' => 400]);
		}

		$id = Model::create($name, $parent);

		if (! $id) {
			return new \WP_Error('duplicate_name', __('A folder with this name already exists at this level.', 'snel'), ['status' => 409]);
		}

		return rest_ensure_response([
			'id'     => $id,
			'name'   => $name,
			'parent' => $parent,
		]);
	}

	/**
	 * Rename a folder.
	 */
	public function rename_folder(\WP_REST_Request $request)
	{
		$id   = (int) $request->get_param('id');
		$name = sanitize_text_field($request->get_param('name'));

		if (empty($name)) {
			return new \WP_Error('missing_name', __('Folder name is required.', 'snel'), ['status' => 400]);
		}

		$result = Model::rename($id, $name);

		if (! $result) {
			return new \WP_Error('rename_failed', __('Could not rename folder. Name may already exist.', 'snel'), ['status' => 409]);
		}

		return rest_ensure_response(['success' => true]);
	}

	/**
	 * Delete a folder.
	 */
	public function delete_folder(\WP_REST_Request $request)
	{
		$id = (int) $request->get_param('id');

		if ($id < 1) {
			return new \WP_Error('invalid_id', __('Invalid folder ID.', 'snel'), ['status' => 400]);
		}

		Model::delete($id);

		return rest_ensure_response(['success' => true]);
	}

	/**
	 * Assign attachments to a folder.
	 */
	public function assign_folder(\WP_REST_Request $request)
	{
		$folder_id      = (int) $request->get_param('folderId');
		$attachment_ids = $request->get_param('attachmentIds');

		if (! is_array($attachment_ids) || empty($attachment_ids)) {
			return new \WP_Error('missing_attachments', __('No attachments provided.', 'snel'), ['status' => 400]);
		}

		$attachment_ids = array_map('intval', $attachment_ids);

		Model::assign($folder_id, $attachment_ids);

		return rest_ensure_response(['success' => true]);
	}
}
