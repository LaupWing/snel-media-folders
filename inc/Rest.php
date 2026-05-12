<?php
/**
 * Snel Media Folders — REST API route definitions.
 *
 * Maps routes to Controller methods. No business logic here.
 *
 * @package Snelstack
 */

namespace Snel\MediaFolders;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Rest {

	private $controller;

	public function __construct() {
		$this->controller = new Controller();
		add_action( 'rest_api_init', [ $this, 'register_routes' ] );
	}

	public function register_routes() {
		$namespace = 'snel/v1';

		register_rest_route( $namespace, '/folders', [
			'methods'             => 'GET',
			'callback'            => [ $this->controller, 'get_folders' ],
			'permission_callback' => [ $this, 'permission_check' ],
		] );

		register_rest_route( $namespace, '/folders', [
			'methods'             => 'POST',
			'callback'            => [ $this->controller, 'create_folder' ],
			'permission_callback' => [ $this, 'permission_check' ],
		] );

		register_rest_route( $namespace, '/folders/rename', [
			'methods'             => 'POST',
			'callback'            => [ $this->controller, 'rename_folder' ],
			'permission_callback' => [ $this, 'permission_check' ],
		] );

		register_rest_route( $namespace, '/folders/delete', [
			'methods'             => 'POST',
			'callback'            => [ $this->controller, 'delete_folder' ],
			'permission_callback' => [ $this, 'permission_check' ],
		] );

		register_rest_route( $namespace, '/folders/assign', [
			'methods'             => 'POST',
			'callback'            => [ $this->controller, 'assign_folder' ],
			'permission_callback' => [ $this, 'permission_check' ],
		] );
	}

	public function permission_check() {
		return current_user_can( 'upload_files' );
	}
}
