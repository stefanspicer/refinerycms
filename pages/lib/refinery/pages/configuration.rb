module Refinery
  module Pages
    include ActiveSupport::Configurable

    config_accessor :pages_per_dialog, :pages_per_admin_index, :new_page_parts,
                    :marketable_urls, :approximate_ascii, :strip_non_ascii,
                    :default_parts, :use_custom_slugs, :scope_slug_by_parent,
                    :cache_pages_backend, :cache_pages_full, :layout_template_whitelist,
                    :use_layout_templates, :page_title, :absolute_page_links, :types,
                    :auto_expand_admin_tree, :show_title_in_body,
                    :friendly_id_reserved_words, :layout_templates_pattern, :view_templates_pattern

    self.pages_per_dialog = 14
    self.pages_per_admin_index = 20
    self.new_page_parts = false
    self.marketable_urls = true
    self.approximate_ascii = false
    self.strip_non_ascii = false
    self.default_parts = [
      {title: "Content0", slug: "content0"},
      {title: "Content1", slug: "content1"},
      {title: "Content2", slug: "content2"},
      {title: "Content3", slug: "content3"},
      {title: "Content4", slug: "content4"},
      {title: "Content5", slug: "content5"},
      {title: "Content6", slug: "content6"},
      {title: "Content7", slug: "content7"},
      {title: "Content8", slug: "content8"},
      {title: "Content9", slug: "content9"},
    ]
    self.use_custom_slugs = false
    self.scope_slug_by_parent = true
    self.cache_pages_backend = false
    self.cache_pages_full = false
    self.layout_template_whitelist = ["application"]
    class << self
      def layout_template_whitelist
        Array(config.layout_template_whitelist).map(&:to_s)
      end

      def default_parts
        if config.default_parts.all? { |v| v.is_a? String }
          new_syntax = config.default_parts.map do |part|
            { title: part, slug: part.downcase.gsub(" ", "_") }
          end
          Refinery.deprecate(
            "Change Refinery::Pages.default_parts= from #{config.default_parts.inspect} to #{new_syntax.inspect}",
            when: "3.2.0"
          )
          new_syntax
        else
          config.default_parts
        end
      end
    end
    self.use_layout_templates = false
    self.page_title = {
      :chain_page_title => false,
      :ancestors => {
        :separator => " | ",
        :class => 'ancestors',
        :tag => 'span'
      },
      :page_title => {
        :class => nil,
        :tag => nil,
        :wrap_if_not_chained => false
      }
    }
    self.show_title_in_body = true
    self.absolute_page_links = false
    self.types = Types.registered
    self.auto_expand_admin_tree = true
    self.friendly_id_reserved_words = %w(
      index new session login logout users refinery admin images
    )
    self.layout_templates_pattern = 'app', 'views', '{layouts,refinery/layouts}', '*html*'
    self.view_templates_pattern = 'app', 'views', '{pages,refinery/pages}', '*html*'
  end
end
