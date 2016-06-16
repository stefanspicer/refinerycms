module Refinery
  class Plugin
    META = {
      "refinery_dashboard"    => {position: 0 },
      "refinery_pages"        => {position: 5 },
      "refinerycms_blog"      => {position: 15},
      "refinerycms_inquiries" => {position: 85},
      "refinery_settings"     => {position: 0 }, #hide
      "refinery_images"       => {position: 0 }, #hide
      "refinery_files"        => {position: 0 }, #hide
    }

    META.default     =  {position: 50}

    attr_accessor :name, :class_name, :controller, :directory, :url,
                  :always_allow_access, :menu_match, :hide_from_menu,
                  :pathname, :icon

    def self.register(&_block)
      yield(plugin = new)

      raise ArgumentError, "A plugin MUST have a name!: #{plugin.inspect}" if plugin.name.blank?

      # Set defaults.
      plugin.menu_match ||= %r{refinery/#{plugin.name}(/.+?)?$}
      plugin.always_allow_access ||= false
      plugin.class_name ||= plugin.name.camelize
      plugin.icon ||= 'icon icon-wrench'
      # plugin.icon available values could be found in this file :
      # core/app/assets/stylesheets/glass/components/_icons.scss

      # add the new plugin to the collection of registered plugins
      ::Refinery::Plugins.registered.unshift plugin
    end

    # Returns the internationalized version of the title
    def title
      ::I18n.translate(['refinery', 'plugins', name, 'title'].join('.'))
    end

    # Returns the internationalized version of the description
    def description
      ::I18n.translate(['refinery', 'plugins', name, 'description'].join('.'))
    end

    # Stores information that can be used to retrieve the latest activities of this plugin
    def activity=(_)
      Refinery.deprecate('Refinery::Plugin#activity=', when: '3.1')
    end

    def dashboard=(_)
      Refinery.deprecate('Refinery::Plugin#dashboard=', when: '3.1')
    end

    # Used to highlight the current tab in the admin interface
    def highlighted?(params)
      !!(params[:controller].try(:gsub, "admin/", "") =~ menu_match)
    end

    def pathname=(value)
      value = Pathname.new(value) if value.is_a? String
      @pathname = value
    end

    def landable?
      !hide_from_menu && url.present?
    end

    # Returns a hash that can be used to create a url that points to the administration part of the plugin.
    def url
      @url ||= build_url

      if @url.is_a?(Hash)
        { only_path: true }.merge(@url)
      elsif @url.respond_to?(:call)
        @url.call
      else
        @url
      end
    end

    def position
      positions_override = Refinery::Core.config.backend_menu_positions
      return positions_override[self.name] if (positions_override.present? && positions_override.has_key?(self.name))
      return @position                     if @position
      return Refinery::Plugin::META[self.name][:position]
    end

    def position=(val)
      @position = val
    end

    def show_for_superuser_only=(val)
      @show_for_superuser_only = val
    end

    def show_for_superuser_only
      return @show_for_superuser_only
    end

  # Make this protected, so that only Plugin.register can use it.
  protected

    def add_activity(options)
      (self.plugin_activity ||= []) << Activity::new(options)
    end

    def initialize
      # provide a default pathname to where this plugin is using its lib directory.
      depth = 4
      self.pathname ||= Pathname.new(caller(depth).first.match("(.*)#{File::SEPARATOR}lib")[1])
    end

    private

    def build_url
      action = controller.presence ||
               directory.to_s.split('/').pop.presence ||
               name

      { controller: "refinery/admin/#{action}" }
    end
  end
end
