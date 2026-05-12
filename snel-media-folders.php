<?php
/**
 * Plugin Name: Snel Media Folders
 * Description: Folder sidebar for the WordPress Media Library. Drag, drop, organize.
 * Version: 1.0.0
 * Author: Snelstack
 * Author URI: https://snelstack.com
 * License: GPL v2 or later
 * Text Domain: snel-media-folders
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
    require_once __DIR__ . '/vendor/autoload.php';

    YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
        'https://github.com/LaupWing/snel-media-folders/',
        __FILE__,
        'snel-media-folders'
    );
}

define( 'SNEL_MEDIA_FOLDERS_VERSION', '1.0.0' );
define( 'SNEL_MEDIA_FOLDERS_DIR', plugin_dir_path( __FILE__ ) );
define( 'SNEL_MEDIA_FOLDERS_URL', plugin_dir_url( __FILE__ ) );

require_once SNEL_MEDIA_FOLDERS_DIR . 'inc/Install.php';
require_once SNEL_MEDIA_FOLDERS_DIR . 'inc/Model.php';
require_once SNEL_MEDIA_FOLDERS_DIR . 'inc/Controller.php';
require_once SNEL_MEDIA_FOLDERS_DIR . 'inc/Rest.php';
require_once SNEL_MEDIA_FOLDERS_DIR . 'inc/QueryFilter.php';

new \Snel\MediaFolders\Rest();
new \Snel\MediaFolders\QueryFilter();

register_activation_hook( __FILE__, [ '\\Snel\\MediaFolders\\Install', 'create_tables' ] );

add_action( 'admin_init', function () {
    $db_version = get_option( 'snel_media_folders_db_version', '0' );
    if ( version_compare( $db_version, SNEL_MEDIA_FOLDERS_VERSION, '<' ) ) {
        \Snel\MediaFolders\Install::create_tables();
        update_option( 'snel_media_folders_db_version', SNEL_MEDIA_FOLDERS_VERSION );
    }
} );

add_action( 'admin_enqueue_scripts', function ( $hook ) {
    $asset_file = SNEL_MEDIA_FOLDERS_DIR . 'build/index.asset.php';
    if ( ! file_exists( $asset_file ) ) {
        return;
    }

    $asset = require $asset_file;

    wp_enqueue_style(
        'snel-media-folders',
        SNEL_MEDIA_FOLDERS_URL . 'build/index.css',
        [],
        $asset['version']
    );

    wp_enqueue_script( 'jquery-ui-draggable' );
    wp_enqueue_script( 'jquery-ui-droppable' );

    wp_enqueue_script(
        'snel-media-folders',
        SNEL_MEDIA_FOLDERS_URL . 'build/index.js',
        array_merge( $asset['dependencies'], [ 'jquery-ui-draggable', 'jquery-ui-droppable', 'wp-data', 'wp-notices' ] ),
        $asset['version'],
        true
    );

    wp_localize_script( 'snel-media-folders', 'snelMediaFolders', [
        'isUploadScreen' => ( 'upload.php' === $hook ) ? '1' : '0',
        'restUrl'        => rest_url( 'snel/v1' ),
        'nonce'          => wp_create_nonce( 'wp_rest' ),
    ] );
} );
