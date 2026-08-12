PREFIX ?= $(HOME)/.local
BINDIR ?= $(PREFIX)/bin
PI_AGENT ?= $(HOME)/.pi/agent
REPO := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))

.PHONY: install uninstall

install:
	mkdir -p "$(BINDIR)"
	ln -sfn "$(REPO)/ad" "$(BINDIR)/ad"
	mkdir -p "$(PI_AGENT)/skills" "$(PI_AGENT)/extensions"
	mkdir -p "$(HOME)/.claude/skills" "$(HOME)/.codex/skills" "$(HOME)/.cursor/skills"
	ln -sfn "$(REPO)/skills/ad" "$(PI_AGENT)/skills/ad"
	ln -sfn "$(REPO)/skills/ad" "$(HOME)/.claude/skills/ad"
	ln -sfn "$(REPO)/skills/ad" "$(HOME)/.codex/skills/ad"
	ln -sfn "$(REPO)/skills/ad" "$(HOME)/.cursor/skills/ad"
	ln -sfn "$(REPO)/extensions/ad-inbox.ts" "$(PI_AGENT)/extensions/ad-inbox.ts"
	"$(BINDIR)/ad" wake install
	@echo "installed ad -> $(BINDIR)/ad"

uninstall:
	-"$(BINDIR)/ad" wake uninstall
	rm -f "$(BINDIR)/ad"
	rm -f "$(PI_AGENT)/skills/ad"
	rm -f "$(HOME)/.claude/skills/ad"
	rm -f "$(HOME)/.codex/skills/ad"
	rm -f "$(HOME)/.cursor/skills/ad"
	rm -f "$(PI_AGENT)/extensions/ad-inbox.ts"
	@echo "uninstalled ad symlinks"
